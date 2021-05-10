const superagent = require("superagent");
const utils = require("formiojs/utils");
module.exports = function (RED) {
  "use strict";
  function FormioConfig(node) {
    RED.nodes.createNode(this, node);
    this.project = node.project;
    this.username = node.username;
    this.password = node.password;
  }

  // function FormValidate(node){
  //   RED.nodes.createNode(this, node);
  //   var config = RED.nodes.getNode(node.formio);
  //   this.on("input", async function(msg) {

  //   }
  // }

  function FormioForm(node) {
    RED.nodes.createNode(this, node);
    var config = RED.nodes.getNode(node.formio);
    this.on("input", async function (msg) {
      console.log("input form io form");
      var src = config.project + "/" + (node.form || msg.form);
      var formio = require("formio-service")({
        formio: config.project,
      });
      try {
        console.log(
          `Authenticazione verso ${config.project} con ${config.username}, *****`
        );
        let r = await formio.authenticate(config.username, config.password);

        let formData = new formio.Form(src);
        let data = await formData.load();
        let flat = [];
        utils.eachComponent(
          formData.form.components,
          (a, b, c) => {
            flat.push(a);
          },
          true
        );

        if (node.output) {
          msg[node.output] = data;
          msg[node.output + "_flat"] = flat;
        } else msg.form = data;
        msg[msg.form + "_flat"] = flat;
      } catch (error) {
        this.error.bind(this);
        // console.log(error);
      }
      this.send(msg);
    });
  }
  function FormioValidate(node) {
    RED.nodes.createNode(this, node);
    var config = RED.nodes.getNode(node.formio);
    this.on("input", async function (msg) {
      console.log("input form io form");
      var src = config.project + "/" + (node.form || msg.form);
      var formio = require("formio-service")({
        formio: config.project,
      });
      try {
        console.log(
          `Authenticazione verso ${config.project} con ${config.username}, *****`
        );
        let r = await formio.authenticate(config.username, config.password);
        //recupero anche informazioni relative alla blacklist

        let res = await new formio.Form(src).submit({ data: msg.payload });
        msg.statusCode = 200;
        this.send([msg]);
      } catch (error) {
        if (error.response) {
          this.error = error.response.body;
          msg.error = this.error;
          msg.statusCode = error.response.statusCode;
          if (msg.statusCode == 400) {
            this.send([null, msg]);
          }
        } else {
          this.error(error.message, msg);
          console.log(error);
        }
      }
    });
  }

  function FormioCopy(node) {
    RED.nodes.createNode(this, node);
    var config = RED.nodes.getNode(node.formio);
    this.on("input", async function (msg) {
      console.log("input form io form");
      let dst = msg.dst || node.dst;
      let src = msg.src || node.src;
      var formio = require("formio-service")({
        formio: config.project,
      });
      try {
        console.log(
          `Authenticazione verso ${config.project} con ${config.username}, *****`
        );
        let r = await formio.authenticate(config.username, config.password);
        //recupero anche informazioni relative alla blacklist

        let res = await new formio.Form(src).submit({ data: msg.payload });
        msg.statusCode = 200;
        this.send([msg]);
      } catch (error) {
        this.error = error.response.body;
        msg.error = this.error;
        msg.statusCode = error.response.statusCode;
        if (msg.statusCode == 400) {
          this.send([null, msg]);
        }
      }
    });
  }
  RED.nodes.registerType("formio copy", FormioCopy);

  RED.nodes.registerType("formio validate", FormioValidate);
  RED.nodes.registerType("formio form", FormioForm);
  RED.nodes.registerType("formio config", FormioConfig);
};
