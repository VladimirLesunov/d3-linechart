const margin = {left: 80, right: 100, top: 50, bottom: 100},
  height = 500 - margin.top - margin.bottom,
  width = 800 - margin.left - margin.right;

const t = function () {
  return d3.transition().duration(500);
};

const svg = d3.select("#chart-area").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
  .attr("transform", "translate(" + margin.left +
    ", " + margin.top + ")");

// Time parser for x-scale
const parseTime = d3.timeParse("%d/%m/%Y");
const formatTime = d3.timeFormat("%d/%m/%Y");
// For tooltip
const bisectDate = d3.bisector(d => parseTime(d.date)).left;

// Scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Axis generators
const xAxisCall = d3.axisBottom();
const yAxisCall = d3.axisLeft()
  .ticks(6, d3.format('s'));

// Axis groups
const xAxis = g.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")");
const yAxis = g.append("g")
  .attr("class", "y axis");

// Y-Axis label
yAxis.append("text")
  .attr("class", "axis-title")
  .attr("transform", "rotate(-90)")
  .attr("y", 6)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .attr("fill", "#5D6971")
  .text("(Population)");

g.append("path")
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", "grey")
  .attr("stroke-width", "3px");

const coinSelect = $('#coin-select');
const variantSelect = $('#var-select');

d3.json("data/coins.json").then(data => {
  let selectedCoin = coinSelect.val();
  let selectedYVariant = variantSelect.val();

  $('#date-slider').slider({
    max: parseTime("31/10/2017").getTime(),
    min: parseTime("12/05/2013").getTime(),
    step: 86400000,
    range: true,
    values: [parseTime("12/05/2013").getTime(), parseTime("31/10/2017").getTime()],
    slide: (e, ui) => {
      $("#dateLabel1").text(formatTime(new Date(ui.values[0])));
      $("#dateLabel2").text(formatTime(new Date(ui.values[1])));
      update(data[selectedCoin], selectedYVariant)
    }
  });

  coinSelect.on('change', e => {
    selectedCoin = e.target.value;
    update(data[selectedCoin], selectedYVariant)

  });
  variantSelect.on('change', e => {
    selectedYVariant = e.target.value;
    update(data[selectedCoin], selectedYVariant)
  });

  update(data[selectedCoin], selectedYVariant);

});

function update(data, selectedYVariant) {

  data = data.filter(datum => {
    const datumDate = parseTime(datum['date']).getTime();
    const sliderValues = $('#date-slider').slider('values');
    return (datumDate >= sliderValues[0]) && (datumDate <= sliderValues[1])
  });
  // Set scale domains
  x.domain(d3.extent(data, d => parseTime(d.date)));
  y.domain([d3.min(data, d => +d[selectedYVariant]) / 1.005, d3.max(data, d => +d[selectedYVariant]) * 1.005]);

  const line = d3.line()
    .x(d => x(parseTime(d.date)))
    .y(d => y(+d[selectedYVariant]));

  // Generate axes once scales have been set
  xAxis.transition(t()).call(xAxisCall.scale(x));
  yAxis.transition(t()).call(yAxisCall.scale(y));

  // Add line to chart
  g.select('.line')
    .transition(t())
    .attr("d", line(data));


  /******************************** Tooltip Code ********************************/

  const focus = g.append("g")
    .attr("class", "focus")
    .style("display", "none");

  focus.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height);

  focus.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", 0)
    .attr("x2", width);

  focus.append("circle")
    .attr("r", 7.5);

  focus.append("text")
    .attr("x", 15)
    .attr("dy", ".31em");

  g.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", () => focus.style("display", null))
    .on("mouseout", () => focus.style("display", "none"))
    .on("mousemove", mousemove);

  function mousemove() {
    const x0 = x.invert(d3.mouse(this)[0]),
      i = bisectDate(data, x0, 1),
      d0 = data[i - 1],
      d1 = data[i],
      d = !!d0 && !!d1 && (x0 - d0.year > d1.year - x0) ? d1 : d0;
    focus.attr("transform", "translate(" + x(parseTime(d.date)) + "," + y(+d[selectedYVariant]) + ")");
    focus.select("text").text(+d[selectedYVariant]);
    focus.select(".x-hover-line").attr("y2", height - y(+d[selectedYVariant]));
    focus.select(".y-hover-line").attr("x2", -x(parseTime(d.date)));
  }


  /******************************** Tooltip Code ********************************/
}

