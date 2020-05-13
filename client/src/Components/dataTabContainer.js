import React from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  Button,
  Tabs,
  Tab,
  Typography,
  Box
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { httpGet, generateFieldMap, httpPut, httpDelete } from "../Api/http";
import DataTable from "./dataTable";
import "./dataTabContainer.css";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box className="tab-panel-box" p={3}>
          {children}
        </Box>
      )}
    </Typography>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired
};

class DataTabContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { orgId: "", tabValue: 0, data: [], orgName: '' };

    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
  }

  async componentWillMount() {
    // Fetch data before render, matches ID param in URL
    const {
      match: { params }
    } = this.props;
    this.setState({ orgId: params.id }, async () => {
      await this.getData();
    });
  }

  async getData() {
    // Get object data along with fields and custom fields
    this.props.handleLoading();
    httpGet(`/api/Connections`, {
      params: {
        opts: {
          attributes: ["org_name"],
          include: [{
            association: "Objects",
            include: [
              {
                association: "Fields",
                include: [{ association: "CustomField" }]
              }
            ]
          }],
          where: {
            id: this.state.orgId
          }
        }
      }
    }).then(
      result => {
        this.props.handleLoading();
        this.props.handleSnack("success", "Fetching data was successful");
        this.setState({ data: result[0].Objects, orgName: result[0].org_name });
      },
      err => {
        this.props.handleLoading();
        this.props.handleSnack("error", "Error fetching field data");
      }
    );
  }

  handleTabChange(event, value) {
    this.setState({ tabValue: value });
  }

  async handleRefresh(event) {
    // Get generated field map from Salesforce and assign ID's to fields so that custom fields aren't lost
    this.props.handleLoading();
    generateFieldMap(this.state.orgId).then(
      result => {
        if (this.state.data[0].Fields.length > 0) {
          this.matchFieldMapToIds(result);
        } else {
          // There is no field map data so create fresh
          httpPut("/api/fields", result).then(result => {
            this.props.handleLoading();
            this.props.handleSnack("Success", "Fields saved successfully");
            this.getData();
          });
        }
      },
      err => {
        this.props.handleLoading();
        this.props.handleSnack("error", "Error generating field map");
      }
    );
  }

  matchFieldMapToIds(fieldMap) {
    // There is field map data in state and a refresh was performed. Need to match old and new fields to keep ID the same
    // Not worried about custom fields, seperate table
    let updateArr = [];
    let tempOldFields = [];
    // Create temp array of old fields not separated into objects to make filtering easier
    for (let obj of this.state.data) {
      for (let oldField of obj.Fields) {
        tempOldFields.push(oldField);
      }
    }
    for (let x = 0; x < fieldMap.length; x++) {
      for (let y = 0; y < tempOldFields.length; y++) {
        if (
          fieldMap[x].name === tempOldFields[y].name &&
          fieldMap[x].object_id === tempOldFields[y].object_id
        ) {
          // Update with same ID
          fieldMap[x].id = tempOldFields[y].id;
          updateArr.push(fieldMap[x]);
          // remove matching fields from old and new arrays
          fieldMap.splice(x, 1);
          tempOldFields.splice(y, 1);
          x--;
          break;
        }
      }
    }
    // Should be left with fieldMap containing new fields to be created and tempOldFields containing old fields to be deleted.
    let deleteArr = tempOldFields.map(x => {
      return x.id;
    });
    this.pushFieldArraysToDb(fieldMap, updateArr, deleteArr);
  }

  async pushFieldArraysToDb(createArr, updateArr, deleteArr) {
    // Wait for all of the updates to finish then call a new fetch data to refresh table view
    let promises = [];
    if (createArr.length > 0) {
      let prom1 = httpPut("/api/Fields", createArr).then(
        () => { },
        err => {
          this.props.handleSnack("error", "Error creating Fields");
        }
      );
      promises.push(prom1);
    }
    if (updateArr.length > 0) {
      let prom2 = httpPut("/api/Fields", updateArr).then(
        () => { },
        err => {
          this.props.handleSnack("error", "Error updating Fields");
        }
      );
      promises.push(prom2);
    }
    if (deleteArr.length > 0) {
      let prom3 = httpDelete("/api/Fields", deleteArr).then(
        () => { },
        err => {
          this.props.handleSnack("error", "Error deleting Fields");
        }
      );
      promises.push(prom3);
    }
    Promise.all(promises).then(() => {
      this.props.handleLoading();
      this.getData();
    });
  }

  render() {
    return (
      <div>
        <h1>{this.state.orgName}</h1>
        <div className="actions">
          <Link to={`/`}>
            <Button color="secondary">Back to connections</Button>
          </Link>
          <Button color="primary" onClick={this.handleRefresh}>
            Refresh
          </Button>
        </div>
        <AppBar position="static">
          <Tabs
            value={this.state.tabValue}
            onChange={this.handleTabChange}
            aria-label="Data table tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {this.state.data.map((x, i) => (
              <Tab label={x.object_api_name} />
            ))}
          </Tabs>
        </AppBar>
        {this.state.data.map((x, i) => (
          <TabPanel value={this.state.tabValue} index={i}>
            {this.state.data && this.state.data.length > 0 && (
              <DataTable data={x} handleSnack={this.props.handleSnack} />
            )}
          </TabPanel>
        ))}
      </div>
    );
  }
}

export default DataTabContainer;
