import {
  InstanceBase,
  InstanceStatus,
  runEntrypoint,
} from "@companion-module/base";

import { getActionDefinitions } from "./actions.js";
import { ConfigFields } from "./config.js";
import { getFeedbackDefinitions } from "./feedbacks.js";
import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";

class AWSInstance extends InstanceBase {
  async init(config) {
    this.config = config;
    this.instances = {};
    this.connectToAWS();
    this.setActionDefinitions(getActionDefinitions(this));
    this.setFeedbackDefinitions(getFeedbackDefinitions(this));
  }

  async connectToAWS() {
    try {
      // Initialize EC2Client
      this.ec2Client = new EC2Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      // Test the connection by calling describeInstances (or any light EC2 call)
      const testResponse = await this.ec2Client.send(
        new DescribeInstancesCommand({})
      );

      console.log("AWS connection successful!");
      this.updateStatus(InstanceStatus.Ok, "Connected to AWS");
      this.getAllInstances();
      this.feedbackInterval = setInterval(() => {
        this.getAllInstances();
      }, this.config.pollingInterval * 1000);
    } catch (error) {
      console.log("Failed to connect to AWS EC2:", error);

      this.updateStatus(
        InstanceStatus.ConnectionFailure,
        "Please validate your AWS credentials and ensure you are connected to the internet."
      );
      return;
    }
  }

  async configUpdated(config) {
    this.config = config;
    this.instances = {};
    this.connectToAWS();
  }

  async destroy() {
    this.ec2Client = null;
  }

  getConfigFields() {
    return ConfigFields;
  }

  async getAllInstances() {
    try {
      const data = await this.ec2Client.send(new DescribeInstancesCommand({}));

      for (const reservation of data.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          this.instances[instance.InstanceId] = {
            id: instance.InstanceId,
            name:
              instance.Tags?.find((tag) => tag.Key === "Name")?.Value ||
              "Unnamed",
            state: instance.State?.Name || "Unknown",
            type: instance.InstanceType || "Unknown",
          };
        }
      }
    } catch (error) {
      console.error("Error fetching instance details: ", error);
    }
    this.checkFeedbacks();
    this.setActionDefinitions(getActionDefinitions(this));
    this.setFeedbackDefinitions(getFeedbackDefinitions(this));
  }
}

runEntrypoint(AWSInstance, []);
