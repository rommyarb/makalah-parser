Vue.use(VueMaterial.default)
new Vue({
  el: "#app",
  data: {
    finished: false,
    msg: "Bambang",
    processing: false,
    currentFilename: "",
    statusLog: "",
    xmlFiles: [],
    errors: [],
    nodes: [
      {
        author: "Bambang",
        publishedYear: "2020",
        citedBy: [
          { nama: "ohohoh" },
          { nama: "ohohoh" },
          { nama: "ohohoh" },
          { nama: "ohohoh" },
          { nama: "ohohoh" },
        ],
      },
      {
        author: "Bambang 2",
        publishedYear: "2020",
        citedBy: [{ nama: "ohohoh" }, { nama: "ohohoh" }],
      },

      {
        author: "Bambang 3",
        publishedYear: "2018",
        citedBy: [{ nama: "ohohoh" }, { nama: "ohohoh" }],
      },
    ],
    fileChosen: false,
  },
  computed: {
    nodesJson() {
      return JSON.stringify(this.nodes)
    },
  },
  methods: {
    initProcessFullText() {
      this.statusLog = "Processing..."
      this.startProcessFullText(0)
    },
    startProcessFullText(i, retry = false) {
      this.processFullText(i, retry)
    },
    async processFullText(i, retry) {
      var url = "https://grobid.rommyarb.dev/api/processFulltextDocument"
      var form = new FormData()
      var files = this.$refs.fileinput.files
      var file = files[i]
      if (file) {
        if (!retry) {
          this.currentFilename = file.name
          // this.statusLog = "Parsing " + (i + 1) + " of " + files.length + " files...";
        }
        this.addBeforeUnloadEvent()
        form.append("input", file)
        this.processing = true
        try {
          var that = this
          var r = await axios.post(url, form, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: function (progressEvent) {
              var completed = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              )
              if (completed < 100) {
                that.statusLog = "Uploading " + completed + " %"
              } else {
                that.statusLog =
                  "Parsing " + (i + 1) + " of " + files.length + " files..."
              }
            },
          })

          var xmlData = r.data

          /////////////////////////////////////////////////////////////////////////
          if (parser.validate(xmlData)) {
            var options = {
              ignoreAttributes: false,
            }
            var jsonObj = parser.parse(xmlData, options)

            // TITLE
            var title =
              jsonObj["TEI"]["teiHeader"]["fileDesc"]["titleStmt"]["title"][
                "#text"
              ]
            var authors =
              jsonObj["TEI"]["teiHeader"]["fileDesc"]["sourceDesc"][
                "biblStruct"
              ]["analytic"]["author"]
            // console.log("TITLE:", title)

            // PUBLISHED YEAR
            var publishedYear = jsonObj["TEI"]["teiHeader"]["fileDesc"][
              "sourceDesc"
            ]["biblStruct"]["monogr"]["imprint"]
              ? jsonObj["TEI"]["teiHeader"]["fileDesc"]["sourceDesc"][
                  "biblStruct"
                ]["monogr"]["imprint"]["date"]
                ? jsonObj["TEI"]["teiHeader"]["fileDesc"]["sourceDesc"][
                    "biblStruct"
                  ]["monogr"]["imprint"]["date"]["@_when"]
                : null
              : null

            // AUTHOR(S)
            var theAuthor = ""
            if (Array.isArray(authors)) {
              for (var [j, author] of authors.entries()) {
                if (author) {
                  var roleName = author["persName"]
                    ? author["persName"]["roleName"]
                    : null
                  var surname = author["persName"]
                    ? author["persName"]["surname"]
                    : null
                  var fullname = (roleName ? roleName + " " : "") + surname
                  if (fullname != undefined && fullname != "undefined") {
                    authors[j] = fullname
                  }
                } else {
                  authors[j] = null
                }
              }
              theAuthor = authors.join(" & ").replace(/\s+/g, " ").trim()
            } else {
              var author = authors
              if (author) {
                var roleName = author["persName"]
                  ? author["persName"]["roleName"]
                  : null
                var surname = author["persName"]
                  ? author["persName"]["surname"]
                  : null
                var fullname = (roleName ? roleName + " " : "") + surname
                theAuthor = fullname.replace(/\s+/g, " ").trim()
              } else {
                theAuthor = null
              }
            }

            var references = []
            var refDiv = jsonObj["TEI"]["text"]["back"]["div"]
            if (Array.isArray(refDiv)) {
              references = refDiv.find(
                (item) => item["@_type"] == "references"
              )["listBibl"]["biblStruct"]
            } else {
              references = refDiv["listBibl"]["biblStruct"]
            }

            if (references && Array.isArray(references)) {
              // START ITERATION HERE

              for (var ref of references) {
                // Ref Title
                var titleRef = ref["monogr"]["title"]["#text"]

                // Ref Author
                var authorsRef = ref["analytic"]
                if (authorsRef) {
                  authorsRef = ref["analytic"]["author"]
                } else {
                  authorsRef = ref["monogr"]["author"]
                }
                var theAuthorRef = "" // 1
                if (Array.isArray(authorsRef)) {
                  for (var [j, author] of authorsRef.entries()) {
                    if (author) {
                      var roleName = author["persName"]
                        ? author["persName"]["roleName"]
                        : null
                      var surname = author["persName"]
                        ? author["persName"]["surname"]
                        : null
                      var fullname = (roleName ? roleName + " " : "") + surname
                      if (fullname != undefined && fullname != "undefined") {
                        authorsRef[j] = fullname
                      }
                    } else {
                      authorsRef[j] = null
                    }
                  }
                  // console.log("authorsRef:", authorsRef)
                  theAuthorRef = authorsRef
                    .join(" & ")
                    .replace(/\s+/g, " ")
                    .trim()
                } else {
                  if (authorsRef) {
                    var author = authorsRef
                    var roleName = author["persName"]
                      ? author["persName"]["roleName"]
                      : null
                    var surname = author["persName"]
                      ? author["persName"]["surname"]
                      : null
                    var fullname = (roleName ? roleName + " " : "") + surname
                    theAuthorRef = fullname.replace(/\s+/g, " ").trim()
                  } else {
                    theAuthorRef = null
                  }
                }

                if (theAuthorRef) {
                  // Ref Published Year
                  var publishedYearRef = ref["monogr"]["imprint"]["date"]
                    ? ref["monogr"]["imprint"]["date"]["@_when"]
                    : null

                  var node = {
                    title: titleRef,
                    author: theAuthorRef,
                    publishedYear: publishedYearRef,
                    citedBy: [
                      {
                        title: title,
                        author: theAuthor,
                        publishedYear: publishedYear,
                      },
                    ],
                  }

                  // console.log("Filename:", file.name)
                  // console.log("NODE:", node)

                  var checkNode = this.nodes.find((mainNode) => {
                    if (
                      mainNode.author === node.author &&
                      mainNode.publishedYear === node.publishedYear
                    ) {
                      return true
                    } else {
                      return false
                    }
                  })

                  if (checkNode) {
                    // console.warn("checkNode exists, adding to citedBy....")
                    // add to citedBy
                    var checkCitedBy = checkNode.citedBy.find(
                      (item) =>
                        item.author == theAuthor &&
                        item.publishedYear == publishedYear
                    )
                    if (checkCitedBy) {
                      // console.log("citedBy already exist")
                    } else {
                      // console.log("add to citedBy")
                      checkNode.citedBy = [
                        ...checkNode.citedBy,
                        {
                          title: title,
                          author: theAuthor,
                          publishedYear: publishedYear,
                        },
                      ]
                    }
                  } else {
                    // console.log("checkNode doesn't exists, pushing new node")
                    // push to nodes

                    this.nodes.push(node)
                  }
                } else {
                  // console.warn("The ref author is null.")
                }
              }
            }
          }

          // updateGraph(this.nodes)

          /////////////////////////////////////////////////////////////////////////

          if (i < files.length - 1) {
            // console.log("next please...")
            // console.log(
            // "========================================================================================="
            // )
            this.startProcessFullText(i + 1)
          } else {
            this.removeBeforeUnloadEvent()
            // console.log("🏁🏁 FINISHED 🏁🏁")
            this.processing = false
            this.finished = true

            // save to json
            // var blob = new Blob([JSON.stringify(this.nodes)], {
            //   type: "application/json; charset=UTF-8",
            // })
            // saveAs(blob, "hasil_parse_" + files.length + "_file.json")

            // filter
            var minimum = 5
            var nodes = this.nodes.filter(
              (node) => node.citedBy.length >= minimum
            )

            // save to localstorage
            window.localStorage.setItem("data", JSON.stringify(nodes))
            window.location.href = "graph"
          }
        } catch (e) {
          console.error("ERROR:", e)
          var status = e.response ? e.response.status : null
          if (status) {
            // skip this file
            this.statusLog = "File ERROR. Skipping..."
            this.errors.push(file)
            var that = this
            setTimeout(function () {
              if (i < files.length - 1) {
                that.startProcessFullText(i + 1)
              } else {
                that.processing = false
                // console.log(that.xmlFiles)
              }
            }, 500)
          } else {
            // try again
            // console.log("trying again")
            this.statusLog =
              "[Retry] Processing " +
              (i + 1) +
              " of " +
              files.length +
              " files..."
            this.startProcessFullText(i, true)
          }
        }
      } else {
        alert("No files selected.")
      }
    },
    onBeforeUnload(e) {
      e.returnValue = "In progress."
    },
    addBeforeUnloadEvent() {
      addEventListener("beforeunload", this.onBeforeUnload)
    },
    removeBeforeUnloadEvent() {
      removeEventListener("beforeunload", this.onBeforeUnload)
    },
  },
})
