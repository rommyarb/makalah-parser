// This site's Engine v1.0.0
// by @rommyarb

var app = new Vue({
  el: "#app",
  data: {
    msg: "Bambang",
    processing: false,
    currentFilename: "",
    statusLog: "",
    xmlFiles: [],
    errors: [],
  },
  methods: {
    initProcessFullText() {
      this.startProcessFullText(0);
    },
    startProcessFullText(i, retry = false) {
      this.processFullText(i, retry);
    },
    async processFullText(i, retry) {
      var url = "https://grobid.rommyarb.dev/api/processFulltextDocument";
      var form = new FormData();
      var files = this.$refs.fileinput.files;
      var file = files[i];
      if (file) {
        if (!retry) {
          this.currentFilename = file.name;
          // this.statusLog = "Processing " + (i + 1) + " of " + files.length + " files...";
        }
        this.addBeforeUnloadEvent();
        form.append("input", file);
        this.processing = true;
        try {
          var that = this;
          var r = await axios.post(url, form, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: function (progressEvent) {
              var completed = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              if (completed < 100) {
                that.statusLog = "Uploading " + completed + " %";
              } else {
                that.statusLog =
                  "Processing " + (i + 1) + " of " + files.length + " files...";
              }
            },
          });
          this.xmlFiles.push(r.data);
          if (i < files.length - 1) {
            this.startProcessFullText(i + 1);
          } else {
            this.processing = false;
            console.log(this.xmlFiles);
          }
        } catch (e) {
          var status = e.response.status;
          if (status == 500) {
            // skip this file
            this.statusLog = "File ERROR. Skipping...";
            this.errors.push(file);
            var that = this;
            setTimeout(function () {
              if (i < files.length - 1) {
                that.startProcessFullText(i + 1);
              } else {
                that.processing = false;
                console.log(that.xmlFiles);
              }
            }, 1000);
          } else {
            // try again
            console.log("trying again");
            this.statusLog =
              "[Retry] Processing " +
              (i + 1) +
              " of " +
              files.length +
              " files...";
            this.startProcessFullText(i, true);
          }
        }
      } else {
        alert("No files selected.");
      }
    },
    onBeforeUnload(e) {
      e.returnValue = "In progress.";
    },
    addBeforeUnloadEvent() {
      addEventListener("beforeunload", this.onBeforeUnload);
    },
    removeBeforeUnloadEvent() {
      removeEventListener("beforeunload", this.onBeforeUnload);
    },
    // parsing XML to json datap
    initParseXML() {
      this.startParseXML(0);
    },
    startParseXML(i) {
      this.parseXML(i);
    },
    parseXML(i) {
      function readFile(files, index) {
        fs.appendFileSync(
          "ini_dia.txt",
          "\n" + ">> Reading " + files[index] + "\n"
        );
        xml2js = require("xml2js");
        var parser = new xml2js.Parser();
        var theDir = "./pdf_outputs";
        var path = theDir + "/" + files[index];

        fs.readFile(path, function (err, data) {
          parser.parseString(data, function (err, result) {
            var rawData =
              result.TEI.text[0].back[0].div[0].listBibl[0].biblStruct;
            if (rawData !== undefined) {
              rawData.forEach(function (item, i) {
                if (
                  item.analytic !== undefined &&
                  item.analytic[0].author !== undefined
                ) {
                  var authors = item.analytic[0].author
                    ? item.analytic[0].author
                    : null;

                  var published = item.monogr[0].imprint[0].date
                    ? item.monogr[0].imprint[0].date[0]["$"].when
                    : null;
                  //////////////////////
                  if (authors) {
                    var _forenames = authors[0].persName[0].forename
                      ? authors[0].persName[0].forename
                      : [];
                    var forenames = _forenames.map((forename) => forename._);
                    var forename = forenames.join(" ");

                    var surname = authors[0].persName[0].surname
                      ? authors[0].persName[0].surname[0]
                      : "";

                    var number = i + 1;
                    if (surname !== "") {
                      var theData = surname + " " + published;
                      console.log(theData);
                      fs.appendFileSync("ini_dia.txt", theData + "\n");
                    } else {
                      var genName = authors[0].persName[0].genName
                        ? authors[0].persName[0].genName + "."
                        : "";
                      if (genName !== "") {
                        var theData =
                          number +
                          ". " +
                          forename +
                          " " +
                          genName +
                          " " +
                          published;
                        console.log(theData);
                        fs.appendFileSync("ini_dia.txt", theData + "\n");
                      }
                    }
                  }
                } else if (item.monogr[0].author !== undefined) {
                  var authors = item.monogr[0].author
                    ? item.monogr[0].author
                    : null;

                  var published = item.monogr[0].imprint[0].date
                    ? item.monogr[0].imprint[0].date[0]["$"].when
                    : null;
                  //////////////////////
                  if (authors) {
                    // var forenames = authors[0].persName[0].forename
                    //   ? authors[0].persName[0].forename
                    //   : [];
                    // var forename = forenames.join(" ");
                    var surname = authors[0].persName[0].surname[0]
                      ? authors[0].persName[0].surname[0]
                      : "";

                    var number = i + 1;
                    var theData = surname + " " + published;
                    console.log(theData);
                    fs.appendFileSync("ini_dia.txt", theData + "\n");
                  }
                } else {
                  console.log("== SKIP ==");
                }
              });
            }
          });
          if (index + 1 < files.length) {
            start(files, index + 1);
          } else {
            console.log("\n");
            console.log("FINISHED !");
          }
        });
      }
    },
  },
});
