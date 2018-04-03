d3.csv("./Seasons_Stats.csv", formatter, function(error, data) {
  if (error) throw error;
  
  var width = 700;
  var height = 700;
  var padding = 100;
  var yearObj = formatAllData(data);
  var yearRange = d3.extent(Object.keys(yearObj));

  var svg =
    d3.select("svg")
        .attr("width", width)
        .attr("height", height);

  // axes
  svg.append("g")
      .attr("transform", `translate(0, ${height - padding + 30})`)
      .classed("x-axis", true);

  svg.append("g")
      .attr("transform", `translate(${padding - 30}, 0)`)
      .classed("y-axis", true);

  // labels
  svg.append("text")
      .text("2PT%")
      .attr("x", width / 2)
      .attr("y", height)
      .attr("dy", "-1.5em")
      .attr("text-anchor", "middle");

  svg.append("text")
      .text("3PT%")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", "1.5em")
      .attr("text-anchor", "middle");

  // title
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", "2.0em")
      .attr("text-anchor", "middle")
      .style("font-size", "1.5em")
      .classed("title", true);

  // year range input
  d3.select("input")
      .property("min", yearRange[0])
      .property("max", yearRange[1])
      .property("value", yearRange[0])
      .on("input", () => drawPlot(+d3.event.target.value));

  // initial plot
  drawPlot(yearRange[0]);

  function drawPlot(year) {
    var data = yearObj[year];

    // scales
    var xScale =
      d3.scaleLinear()
        .domain([0, 1])
        .range([padding, width - padding]);

    var yScale =
      d3.scaleLinear()
        .domain([0, 1])
        .range([height - padding, padding]);

    var fScale =
      d3.scaleLinear()
        .domain([0, 1])
        .range(["blue", "red"]);

    var rScale =
      d3.scaleLinear()
        .domain(d3.extent(data, d => d.minutes))
        .range([5, 30]);

    // axes
    d3.select(".x-axis")
        .call(d3.axisBottom(xScale));

    d3.select(".y-axis")
        .call(d3.axisLeft(yScale));

    // title
    d3.select(".title")
        .text(`NBA 2PT% vs 3PT% (${year})`);
  }
  
  function formatAllData(data) {
    // group data by year then player
    var yearObj =
      d3.nest()
        .key(d => d.year)
        .key(d => d.player)
        .rollup(function(v) {
          var val = v[0];
          return {
            fga: val.fga,
            three: val.three,
            two: val.two,
            true: val.true,
            minutes: val.minutes
          };
        })
        .object(data);
    
    // convert year object value into an array
    for (year in yearObj) {
      var yearArray = [];
      for (player in yearObj[year]) {
        var statsObj = yearObj[year][player];
        var vals = Object.values(statsObj);
        if (!vals.includes(null)) {
          var newObj = {
            year: +year,
            player: player
          }
          yearArray.push(Object.assign(newObj, statsObj))
        }
      }
      // remove years with no complete data for any player
      if (yearArray.length === 0) delete yearObj[year];
      else yearObj[year] = yearArray;
    }
    return yearObj;
  }
});

function formatter(row) {
  // remove rows for players with < 500 FGA
  if (row.FGA < 500) return;

  var obj = {
    year: +row.Year,
    player: row.Player,
    fga: +row.FGA,
    three: +row["3P%"],
    two: +row["2P%"],
    true: +row["TS%"],
    minutes: +row.MP
  }
  // replace empty values with null
  for (key in obj) {
    if (obj[key] === "") obj[key] = null;
  }
  return obj;
}