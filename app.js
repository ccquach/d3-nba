d3.csv("./Seasons_Stats.csv", formatter, function(error, data) {
  if (error) throw error;
  
  var yearObj = formatAllData(data);
  
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