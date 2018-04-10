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

  // description
  svg.append("text")
  	.attr("x", width / 2)
  	.attr("y", "4.5em")
  	.attr("text-anchor", "middle")
  	.style("font-size", "1.0em")
  	.text("Players with at least 100 3PT and 2PT attempts.");

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
        .domain(d3.extent(data, d => d.twoPct))
        .range([padding, width - padding]);

    var yScale =
      d3.scaleLinear()
        .domain(d3.extent(data, d => d.threePct))
        .range([height - padding, padding]);

    var fScale =
      d3.scaleLinear()
        .domain(d3.extent(data, d => d.true))
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

    // draw circles
    var update =
      svg.selectAll("circle")
        .data(data, d => d.player);

    var t =
      d3.transition()
        .duration(750);

    // delete
    update
      .exit()
      .transition(t)
        .attr("r", 0)
      .remove();

    // add new elements
    update
      .enter()
      .append("circle")
        .attr("cx", d => xScale(d.twoPct))
        .attr("cy", d => yScale(d.threePct))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mousemove touchstart", showTooltip)
        .on("mouseout touchend", hideTooltip)
      .merge(update)
      .transition(t)
      .ease(d3.easeSinInOut)
        .attr("cx", d => xScale(d.twoPct))
        .attr("cy", d => yScale(d.threePct))
        .attr("r", d => rScale(d.minutes))
        .attr("fill", d => fScale(d.true));
  }

  function showTooltip(d) {
    var tooltip = d3.select(".tooltip");
    tooltip
        .style("opacity", 1)
        .style("left", d3.event.pageX - tooltip.node().offsetWidth / 2 + "px")
        .style("top", d3.event.pageY + 20 + "px")
        .html(`
          <p>Player: ${d.player}</p>
          <p>Age: ${d.age}</p>
          <p>2P%: ${(d.twoPct * 100).toFixed(1)}%</p>
          <p>2PA: ${d.twoAtt}</p>
          <p>3P%: ${(d.threePct * 100).toFixed(1)}%</p>
          <p>3PA: ${d.threeAtt}</p>
          <p>TS%: ${(d.true * 100).toFixed(1)}%</p>
          <p>Minutes Played: ${d.minutes}</p>
        `);
  }

  function hideTooltip() {
    d3.select(".tooltip")
        .style("opacity", 0);
  }
  
  function formatAllData(data) {
    // group data by year then player
    var yearObj =
      d3.nest()
        .key(d => d.year)
        .key(d => d.player)
        .rollup(function(v) {
          return {
            age: v[0].age,
            threePct: d3.mean(v, d => d.threePct),
            threeAtt: d3.sum(v, d => d.threeAtt),
            twoPct: d3.mean(v, d => d.twoPct),
            twoAtt: d3.sum(v, d =>d.twoAtt),
            true: d3.mean(v, d => d.true),
            minutes: d3.sum(v, d => d.minutes)
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
          var newObj = { player: player }
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
  // remove rows for players with < 100 3PT or 2PT attempts 
  if (row["3PA"] < 100 || row["2PA"] < 100) return;

  var obj = {
    year: +row.Year,
    player: row.Player,
    age: row.Age,
    threePct: row["3P%"],
    threeAtt: row["3PA"],
    twoPct: row["2P%"],
    twoAtt: row["2PA"],
    true: row["TS%"],
    minutes: +row.MP
  }
  // replace empty values with null
  for (key in obj) {
    if (obj[key] === "") obj[key] = null;
  }
  return obj;
}