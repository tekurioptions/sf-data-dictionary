import React from "react";
import { createNewConnection, updateConnection, getOrgObjects, httpPut, httpDelete, generateFieldMap } from "../Api/http";
import "./newConnection.css";
import LoginForm from "./loginForm";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel
} from "@material-ui/core";
import ObjectSearch from "./objectSearch";

class NewConnection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openIn: this.props.openIn ? this.props.openIn : null,
      open: false,
      login_url: this.props.loginUrl ? this.props.loginUrl : null,
      username: this.props.username ? this.props.username : null,
      connStatus: null,
      activeStep: 0,
      orgObjects: [],
      selectedObjects: this.props.selectedObjects
        ? this.props.selectedObjects
        : [],
      orgId: this.props.orgId ? this.props.orgId : null,
      selectedEnvironment: null
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClickOpen = this.handleClickOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
    this.setActiveStep = this.setActiveStep.bind(this);
    this.getStepContent = this.getStepContent.bind(this);
    this.skipToObjects = this.skipToObjects.bind(this);
  }

  handleClickOpen() {
    // Handles dialog open event
    this.setState({ open: true });
    if (this.props.openIn) {
      this.skipToObjects();
    }
  }

  handleClose() {
    // Handles dialog close event and sets all params to null unless openIn is set to connectionTable then reset all but id, username, login
    this.props.refreshData();
    if (this.state.openIn) {
      this.setState({
        open: false,
        password: null,
        security_token: null,
        orgObjects: [],
        activeStep: 0
      });
    } else {
      this.setState({
        open: false,
        orgId: null,
        login_url: null,
        username: null,
        password: null,
        security_token: null,
        orgObjects: [],
        activeStep: 0
      });
    }
  }

  handleChange(id, value) {
    // Receives change event from login form text field. Updates state
    this.setState({ [id]: value });
  }

  handleSelection(objects) {
    // Handles object selection from object search component. Updates state
    let formattedObjects = objects.map(x => {
      let objectToReturn;
      // If updating objects, props.selected objects contains previous objects so use same one
      if (this.state.selectedObjects.length > 0) {
        for (let prevObject of this.state.selectedObjects) {
          if (prevObject.object_api_name === x.name) {
            objectToReturn = prevObject;
            break;
          } else {
            objectToReturn = {
              org_id: this.state.orgId,
              object_api_name: x.name
            };
          }
        }
      } else {
        objectToReturn = { org_id: this.state.orgId, object_api_name: x.name };
      }
      return objectToReturn;
    });
    this.setState({ selectedObjects: formattedObjects });
  }

  handleSnack(status, message) {
    // Creates snackbar message in parent component. Pass status as error, info or success
    this.props.handleSnack(status, message);
  }

  async createConnection() {
    return createNewConnection(this.state.selectedEnvironment).then(result => {
      this.handleSnack("success", "New connection created");
      this.setState({ orgId: result });
      return result;
    },
      err => {
        this.props.handleLoading();
        this.handleSnack("error", "Error creating connection");
      });
  }

  getStepContent(stepIndex) {
    // Returns HTML content for each step in connection stepper
    switch (stepIndex) {
      case 0:
        return (
          <div>
            <DialogContentText>
              Select environment that you will be working in
            </DialogContentText>
            <FormControl component="fieldset">
              <RadioGroup name="environment" onChange={(e) => this.setState({ selectedEnvironment: e.target.value })}>
                <FormControlLabel value="https://test.salesforce.com" control={<Radio />} label="Test" />
                <FormControlLabel value="https://login.salesforce.com" control={<Radio />} label="Production" />
              </RadioGroup>
            </FormControl>
          </div>
        );
      case 1:
        return (
          <div className="object-search-container">
            <ObjectSearch
              availableObjects={this.state.orgObjects}
              selectedObjects={this.state.selectedObjects}
              handleSelection={this.handleSelection}
              // handleLoading={this.props.handleLoading}
            />
          </div>
        );
      default:
        return "Unknown stepIndex";
    }
  }

  async setActiveStep() {
    // Sets current active step and fetches content for step 1.
    // When step is called and step is already at 1, new objects are sent to server. Step 0 is the default and you cannot go backwards
    if (this.state.activeStep === 0) {
      this.props.handleLoading();
      await this.createConnection().then(orgId => {
        getOrgObjects(orgId).then(
          result => {
            this.props.handleLoading();
            this.setState({
              orgObjects: result,
              activeStep: 1,
            });
          },
          err => {
            this.props.handleLoading();
            this.handleSnack("error", "Error fetching objects");
          }
        );
      });
    } else {
      this.createObjects();
    }
  }

  async createObjects() {
    // Adding objects to DB and close. If updating objects, any that are no longer used are removed
    // and new ones are created
    this.props.handleLoading();
    if (this.state.selectedObjects.length > 0) {
      // Create arrays of objects to create, delete
      let objCreate = this.state.selectedObjects.filter(x => !x.id);
      // eslint-disable-next-line array-callback-return
      let objDeleteIds = this.state.selectedObjects.filter(x => {
        if (this.state.selectedObjects.indexOf(x) === -1) {
          return x.id;
        }
      }).map(y => { return y.id });
      if (objCreate && objCreate.length > 0) {
        await httpPut("api/objects", objCreate).then(
          result => {
            this.handleSnack("success", "Objects saved");
          },
          err => {
            this.handleSnack("error", "Error saving objects");
          }
        );
      }
      if (objDeleteIds && objDeleteIds.length > 0) {
        httpDelete("api/objects", objDeleteIds).then(
          result => {
            this.handleSnack("success", "Objects saved");
          },
          err => {
            this.handleSnack("error", "Error saving objects");
          }
        );
      }
      this.buildFieldMap();
    } else {
      httpPut("api/objects", this.state.selectedObjects).then(
        result => {
          this.handleSnack("success", "Objects saved");
        },
        err => {
          this.handleSnack("error", "Error saving objects");
        }
      );
      this.buildFieldMap();
    }
  }

  async buildFieldMap() {
    // Get generated field map from Salesforce and assign ID's to fields so that custom fields aren't lost
    generateFieldMap(this.state.orgId).then(
      result => {
        // There is no field map data so create fresh
        httpPut("/api/fields", result).then(result => {
          this.props.handleSnack("Success", "Fields generated successfully");
          this.props.handleLoading();
          this.handleClose();
        });
      },
      err => {
          this.props.handleLoading();
          this.props.handleSnack("error", "Error generating field map");
      }
    );
  }

  skipToObjects() {
    // When editing selected objects we don't have to change connection information so this a way to skip that
    this.props.handleLoading();
    getOrgObjects(this.state.orgId).then(
      result => {
        this.props.handleLoading();
        this.setState({ orgObjects: result, activeStep: 1 });
      },
      err => {
        this.props.handleLoading();
        this.handleSnack("error", "Error fetching objects");
      }
    );
  }

  render() {
    const steps = ["Create new connection", "Select objects to import"];
    return (
      <div className={this.props.buttonClassName}>
        <Button
          variant="outlined"
          color="primary"
          onClick={this.handleClickOpen}
        >
          {this.props.buttonText}
        </Button>
        <Dialog
          className="dialog"
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogContent className="dialog-content">
            <Stepper activeStep={this.state.activeStep} alternativeLabel>
              {steps.map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {this.getStepContent(this.state.activeStep)}
          </DialogContent>
          <DialogActions>
            {/* {this.state.activeStep === 0 && this.state.orgId && (
              <Button onClick={this.skipToObjects} color="primary">
                Skip to objects
              </Button>
            )} */}
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={this.setActiveStep}
              color="primary"
              disabled={
                (!this.state.selectedEnvironment && this.state.activeStep === 0) ||
                (this.state.activeStep === 1 &&
                  this.state.selectedObjects.length === 0)
              }
            >
              {this.state.activeStep === 0 ? "Create" : "Add"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default NewConnection;
