const { useState, useEffect } = React;

function App() {
  const [geoData, setGeoData] = useState(null);
  const [educationData, setEducationData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response1 = await fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json");
        const response2 = await fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json");
        if (!response1.ok || !response2.ok) {
          throw new Error("Network response was not ok");
        }
        const dataGeo = await response1.json();
        const dataEducation = await response2.json();

        const geoData = topojson.feature(dataGeo, dataGeo.objects.counties).features;
        setGeoData(geoData);
        setEducationData(dataEducation);
      } catch (error) {
        console.error("Error loading the data", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (geoData && educationData) {
      createChoroplethMap(geoData, educationData);
    }
  }, [geoData, educationData]);

  return (
    <div id="container">
      <h1 id="title">Choropleth Map of US Counties</h1>
      <div id="description">Map showing the percentage of people with a bachelor's degree in each county in the US.</div>
      <div id="map"></div>
      <div id="legend"></div>
      <div id="tooltip"></div>
    </div>
  );
}

function createChoroplethMap(geoData, educationData) {
  const width = 1024;
  const height = 768;

  const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const path = d3.geoPath();

  const colorScale = d3.scaleQuantize()
    .domain([0, d3.max(educationData, d => d.bachelorsOrHigher)])
    .range(d3.schemeYlOrRd[9]);

  svg.selectAll("path")
    .data(geoData)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .attr("data-fips", function(d) {
      const countyData = educationData.find(ed => ed.fips === d.id);
      return countyData ? countyData.fips : null;
    })
    .attr("data-education", function(d) {
      const countyData = educationData.find(ed => ed.fips === d.id);
      return countyData ? countyData.bachelorsOrHigher : null;
    })
    .attr("fill", function(d) {
      const countyData = educationData.find(ed => ed.fips === d.id);
      return countyData ? colorScale(countyData.bachelorsOrHigher) : "#ccc";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", function(event, d) {
      const countyData = educationData.find(ed => ed.fips === d.id);
      if (countyData) {
        const tooltip = d3.select("#tooltip");
        tooltip
          .attr("data-education", countyData.bachelorsOrHigher)
          .html(`
            <strong>${countyData.area_name}</strong><br>
            Bachelor's Degree: ${countyData.bachelorsOrHigher}%<br>
            State: ${countyData.state}`);
      }
    })
    .on("mousemove", function(event) {
      const tooltip = d3.select("#tooltip");
      tooltip.style("top", (event.pageY - 30) + "px")
        .style("left", (event.pageX + 20) + "px")
        .style("display", "block");
      d3.select(this)
        .style("stroke", "black")
        .style("stroke-width", "1px");
    })
    .on("mouseout", function() {
      d3.select("#tooltip").style("display", "none");
      d3.select(this).style("stroke", "#fff");
    });

  createLegend(colorScale);
}

function createLegend(colorScale) {
  const legendWidth = 400;
  const legendHeight = 50;
  const margin = { top: 10, right: 10, bottom: 20, left: 20 };

  const legend = d3.select("#legend")
    .append("svg")
    .attr("width", legendWidth + margin.left + margin.right)
    .attr("height", legendHeight + margin.top + margin.bottom)
    .style("position", "absolute")
    .style("top", "20px")
    .style("right", "20px")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const domain = colorScale.domain().map(d => Math.ceil(d));
  console.log(domain);

  const ticks = d3.range(domain[0], domain[1], (domain[1] - domain[0]) / 8);
  ticks.push(domain[1]);

  const legendScale = d3.scaleLinear()
    .domain([domain[0], domain[1]])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .tickValues(ticks)
    .tickFormat(d => `${d}%`);

  const numBlocks = ticks.length - 1;
  const blockWidth = legendWidth / numBlocks;

  legend.append("g")
    .selectAll("rect")
    .data(d3.range(domain[0], domain[1], (domain[1] - domain[0]) / numBlocks))
    .enter()
    .append("rect")
    .attr("x", d => legendScale(d))
    .attr("width", blockWidth)
    .attr("height", 10)
    .attr("fill", d => colorScale(d));

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight - 40})`)
    .call(legendAxis);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

