// var dataURL = "https://rommyarb.dev/burivira/graph/data.json"
var showNameAndYear = true
var showSize = true
var labels
var graph = []

var svg = d3
  .select("div#chart")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .call(
    d3.zoom().on("zoom", function () {
      var t = d3.event.transform
      svg.attr("transform", t)
      // svg.selectAll(".node").attr("transform", t)
      // svg.selectAll(".label").attr("transform", `translate(${t.x},${t.y})`)
    })
  )
  .append("g")

var nodes = svg

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
        return (
          d.author + " " + d.publishedYear + " (Size: " + d.citedBy.length + ")"
        )
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
        return d.citedBy.length + 0.5
      })
      .iterations(4)
  )
// .force("x", d3.forceX().strength(0.00001))
// .force("y", d3.forceY().strength(0.00001));

function init() {
  // graph = r
  var data = window.localStorage.getItem("data")
  graph = data ? JSON.parse(data) : []
  // simulation.nodes(graph)
  // simulation.force("link").links([])

  // var link = svg
  //   .append("g")
  //   .attr("class", "link")
  //   .selectAll("line")
  //   .data([])
  //   .enter()
  //   .append("line")

  nodes = svg
    .append("g")
    .attr("class", "node")
    .selectAll("circle")
    .data(graph)
    .enter()
    .append("circle")

    //Setting node radius by size value. If 'size' key doesn't exist, set radius to 9
    .attr("r", function (d) {
      return d.citedBy.length * 1
    })
    //Colors by 'size' value
    .style("fill", function (d) {
      return color(d.citedBy.length)
    })
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    )

  nodes
    .append("svg:title")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(function (d) {
      return (
        d.author + " " + d.publishedYear + " (Size: " + d.citedBy.length + ")"
      )
    })

  labels = svg
    .append("g")
    .attr("class", "label")
    .selectAll("text")
    .data(graph)
    .enter()
    .append("text")
    .attr("dx", 6)
    .attr("dy", ".35em")
    .style("font-size", 10)
    .text(function (d) {
      return (
        d.author + " " + d.publishedYear + " (Size: " + d.citedBy.length + ")"
      )
    })

  simulation.nodes(graph).on("tick", ticked)
  simulation.force("link").links([])
}

init()

setTimeout(function () {
  simulation.force("charge", d3.forceManyBody().strength(0))
  simulation.alpha(1).restart()
}, 1500)

function ticked() {
  // link
  //   .attr("x1", function (d) {
  //     return d.source.x
  //   })
  //   .attr("y1", function (d) {
  //     return d.source.y
  //   })
  //   .attr("x2", function (d) {
  //     return d.target.x
  //   })
  //   .attr("y2", function (d) {
  //     return d.target.y
  //   })

  nodes
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
  graph.forEach((node) => {
    if (showNameAndYear) {
      node.label = node.author + " " + node.publishedYear
    }
  })
  renderLabel()
}
function toggleSize() {
  graph.forEach((node) => {
    if (showSize) {
      node.label = "Size: " + node.citedBy.length
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
    .data(graph)
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

var i = 0
function reloadGraph() {
  svg.selectAll("circle").remove()
  svg.selectAll("text").remove()

  init()

  simulation
    .force("charge", d3.forceManyBody().strength(-2))
    .force("center", d3.forceCenter(width / 2, height / 2))

  setTimeout(function () {
    simulation.force("charge", d3.forceManyBody().strength(0))
    simulation.alpha(1).restart()
  }, 1500)
}
