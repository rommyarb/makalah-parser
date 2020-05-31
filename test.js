var dataURL = "data.json"
var showNameAndYear = true
var showSize = true
var labels
var graph = {}

var svg = d3
  .select("div#chart")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .call(
    d3.zoom().on("zoom", function () {
      svg.attr("transform", d3.event.transform)
    })
  )
  .append("g")

var color = d3.scaleOrdinal(d3.schemeCategory20c)
// var nodeRadius = 20; // for collide force
var width = window.innerWidth
var height = window.innerHeight

var simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id(function (d) {
        return d.id
      })
      .distance(80)
  )
  .force("charge", d3.forceManyBody().strength(-2))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force(
    "collide",
    d3
      .forceCollide()
      .radius(function (d) {
        return d.size + 0.5
      })
      .iterations(4)
  )
// .force("x", d3.forceX().strength(0.00001))
// .force("y", d3.forceY().strength(0.00001));

fetch(dataURL)
  .then((r) => r.json())
  .then((r) => {
    graph = r
    simulation.nodes(graph.nodes)
    simulation.force("link").links(graph.links)

    var link = svg
      .append("g")
      .attr("class", "link")
      .selectAll("line")
      .data(graph.links)
      .enter()
      .append("line")

    var node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter()
      .append("circle")

      //Setting node radius by size value. If 'size' key doesn't exist, set radius to 9
      .attr("r", function (d) {
        if (d.hasOwnProperty("size")) {
          return d.size * 1
        } else {
          return 9
        }
      })
      //Colors by 'size' value
      .style("fill", function (d) {
        return color(d.size)
      })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )

    node
      .append("svg:title")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function (d) {
        return d.id
      })

    labels = svg
      .append("g")
      .attr("class", "label")
      .selectAll("text")
      .data(graph.nodes)
      .enter()
      .append("text")
      .attr("dx", 6)
      .attr("dy", ".35em")
      .style("font-size", 10)
      .text(function (d) {
        return d.label
      })

    simulation.nodes(graph.nodes).on("tick", ticked)

    simulation.force("link").links(graph.links)

    function ticked() {
      link
        .attr("x1", function (d) {
          return d.source.x
        })
        .attr("y1", function (d) {
          return d.source.y
        })
        .attr("x2", function (d) {
          return d.target.x
        })
        .attr("y2", function (d) {
          return d.target.y
        })

      node
        .attr("cx", function (d) {
          return d.x
        })
        .attr("cy", function (d) {
          return d.y
        })
      labels
        .attr("x", function (d) {
          return d.x
        })
        .attr("y", function (d) {
          return d.y
        })
    }
  })

setTimeout(function () {
  simulation.force("charge", d3.forceManyBody().strength(0))
  simulation.alpha(1).restart()
}, 2000)

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

function dragged(d) {
  d.fx = d3.event.x
  d.fy = d3.event.y
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0)
  d.fx = null
  d.fy = null
}

function toggleNameAndYear() {
  graph.nodes.forEach((node) => {
    if (showNameAndYear) {
      var split = node.label.split(" (")
      node.label = split[0]
    }
  })
  renderLabel()
}
function toggleSize() {
  graph.nodes.forEach((node) => {
    if (showSize) {
      var split = node.label.split(" (")
      var sizeOnly = split[1].replace("Size: ", "").replace(")", "")
      node.label = sizeOnly
    }
  })
  renderLabel()
}

function renderLabel() {
  svg.selectAll("text").remove()
  labels = svg
    .append("g")
    .attr("class", "label")
    .selectAll("text")
    .data(graph.nodes)
    .enter()
    .append("text")
    .attr("dx", -6)
    .attr("dy", ".35em")
    .style("font-size", 10)
    .text(function (d) {
      return d.label
    })

  var elements = document.getElementsByClassName("control-btn")
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0])
  }
}
