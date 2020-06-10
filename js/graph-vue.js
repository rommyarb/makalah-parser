Vue.use(VueMaterial.default)
new Vue({
  el: "#app",
  data: {
    showAuthors: true,
    showPublishedYear: true,
    showSize: true,
    svg: null,
    nodes: null,
    labels: null,
    jsonData: [],
    simulation: null,
    zoom: null,
    log: { text: "", type: "default" },
    timer: null,
  },
  mounted() {
    var svg = d3
      .select("div#chart")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .call(
        d3.zoom().on("zoom", () => {
          var t = d3.event.transform
          svg.attr("transform", t)
          // svg.selectAll(".node").attr("transform", t)
          // svg.selectAll(".label").attr("transform", `translate(${t.x},${t.y})`)
        })
      )
      .append("g")

    this.svg = svg
    this.nodes = svg

    var width = window.innerWidth
    var height = window.innerHeight

    this.simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id(function (d) {
            return (
              d.author +
              " " +
              d.publishedYear +
              " (Size: " +
              d.citedBy.length +
              ")"
            )
          })
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-2))
      .force("center", d3.forceCenter(width / 2.5, height / 3))
      .force(
        "collide",
        d3
          .forceCollide()
          .radius(function (d) {
            return d.citedBy.length + 0.5
          })
          .iterations(4)
      )

    this.init()
  },
  computed: {
    resetDisabled() {
      if (this.showAuthors && this.showPublishedYear && this.showSize) {
        return true
      }
      return false
    },
    tableData() {
      var data = []
      for (var [i, item] of this.jsonData.entries()) {
        data.push([
          i + 1,
          item.title,
          item.author,
          item.publishedYear,
          item.citedBy.length,
        ])
      }
      return data
    },
  },
  methods: {
    init() {
      var localData = window.localStorage.getItem("data")
      if (localData && localData !== "[]") {
        this.jsonData = JSON.parse(localData)
        this.log = {
          text: "> Loaded latest data.",
          type: "default",
        }
      } else {
        this.log = {
          text: "(No data loaded)",
          type: "default",
        }
      }
      var color = d3.scaleOrdinal(d3.schemeCategory20c)

      this.nodes = this.svg
        .append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(this.jsonData)
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
            .on("start", this.dragstarted)
            .on("drag", this.dragged)
            .on("end", this.dragended)
        )

      this.nodes
        .append("svg:title")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function (d) {
          return (
            d.author +
            " " +
            d.publishedYear +
            " (Size: " +
            d.citedBy.length +
            ")"
          )
        })

      this.labels = this.svg
        .append("g")
        .attr("class", "label")
        .selectAll("text")
        .data(this.jsonData)
        .enter()
        .append("text")
        .attr("dx", 6)
        .attr("dy", ".35em")
        .style("font-size", 10)
        .text(function (d) {
          return (
            d.author +
            " " +
            d.publishedYear +
            " (Size: " +
            d.citedBy.length +
            ")"
          )
        })
      this.simulation.nodes(this.jsonData).on("tick", this.ticked)
      this.stopCharge()
      this.initTable()
    },
    ticked() {
      this.nodes
        .attr("cx", function (d) {
          return d.x
        })
        .attr("cy", function (d) {
          return d.y
        })
      this.labels
        .attr("x", function (d) {
          return d.x
        })
        .attr("y", function (d) {
          return d.y
        })
    },
    dragstarted(d) {
      if (!d3.event.active) this.simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    },
    dragged(d) {
      d.fx = d3.event.x
      d.fy = d3.event.y
    },
    dragended(d) {
      if (!d3.event.active) this.simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    },
    toggleLegends() {
      this.jsonData.forEach((node) => {
        var authors = this.showAuthors ? node.author : ""
        var publishedYear = this.showPublishedYear ? node.publishedYear : ""
        var size = this.showSize ? "(Size: " + node.citedBy.length + ")" : ""

        var joined =
          authors +
          (this.showAuthors ? " " : "") +
          publishedYear +
          (this.showPublishedYear ? " " : "") +
          size

        node.label = joined
      })
      this.reRenderLabel()
    },
    reRenderLabel() {
      this.labels.text(function (d) {
        return d.label
      })
    },
    reloadGraph() {
      this.showAuthors = true
      this.showPublishedYear = true
      this.showSize = true

      this.svg.selectAll("circle").remove()
      this.svg.selectAll("text").remove()

      this.init()
    },
    stopCharge() {
      if (this.timer) {
        window.clearTimeout(this.timer)
      }
      this.timer = window.setTimeout(() => {
        this.simulation.force("charge", d3.forceManyBody().strength(0))
        this.simulation.alpha(1).restart()
      }, 1500)
    },
    downloadJsonFile() {
      var blob = new Blob([JSON.stringify(this.jsonData)], {
        type: "application/json; charset=UTF-8",
      })
      saveAs(blob, "hasil_parse.json")
    },
    loadJsonFile() {
      var files = this.$refs.fileinput.files
      var jsonFile = files[0]
      var reader = new FileReader()
      reader.addEventListener("load", (e) => {
        window.localStorage.setItem("data", e.target.result)
        this.reloadGraph()
        this.log = { text: "✔ Loaded data from JSON file.", type: "success" }
      })
      reader.readAsText(jsonFile)
    },
    initTable() {
      // document.getElementById("table").outerHTML = ""
      // var newDiv = window.document.createElement("div")
      // newDiv.setAttribute("id", "table")
      // var afterDiv = document.getElementById("afterTable")
      // window.document.body.insertBefore(newDiv, afterDiv)

      new gridjs.Grid({
        columns: [
          "",
          "Title",
          "Author(s)",
          "Published Year",
          "Cited By Amount",
        ],
        data: this.tableData,
        search: {
          enabled: true,
          placeholder: "Search...",
        },
        pagination: {
          enabled: true,
          limit: 5,
          summary: true,
        },
      }).render(document.getElementById("table"))
    },
  },
})
