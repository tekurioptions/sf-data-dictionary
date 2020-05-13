import React from "react";
import { httpGet, httpDelete, generateExcel } from "../Api/http";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  ButtonGroup
} from "@material-ui/core";
import NewConnection from "./newConnection";
import ConfirmDialog from "./confirmDialog";
import DataTabContainer from "./dataTabContainer";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import { Link } from 'react-router-dom';
import './connectionTable.css';

class ConnectionTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [] };
    this.getConnectionData = this.getConnectionData.bind(this);
  }

  componentWillMount() {
    // Will mount fetches data before render
    this.getConnectionData();
  }

  async getConnectionData() {
    this.props.handleLoading()
    httpGet("/api/Connections/", {
      params: {
        opts: {
          attributes: ["id", "org_name", "login_url", "username"],
          include: ["Objects"]
        }
      }
    }).then(result => {
      this.props.handleLoading();
      this.setState({ data: result });
    }, err => {
      this.props.handleLoading();
    });
  }

  async handleConnectionDelete(orgId) {
    // Send only ID inside array when deleting
    this.props.handleLoading();
    httpDelete("/api/Connections", [orgId]).then(
      result => {
        this.props.handleLoading();
        this.props.handleSnack("success", "Connection deleted");
        this.getConnectionData();
      },
      err => {
        this.props.handleLoading();
        this.handleSnack(
          "error",
          "There was an error when deleting connection"
        );
      }
    );
  }

  async handleExport(orgId, orgName) {
    generateExcel(orgId, orgName);
  }

  render() {
    let data = this.state.data;
    return (
      <div>
        <h1>Data Dictionary</h1>
        <NewConnection
          buttonText="Create New Connection"
          handleSnack={this.props.handleSnack}
          refreshData={this.getConnectionData}
          handleLoading={this.props.handleLoading}
        />
        <hr></hr>
        <TableContainer component={Paper}>
          <Table className="connection-table" aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Organization Name</TableCell>
                <TableCell align="center">Login URL</TableCell>
                <TableCell align="center">Username</TableCell>
                <TableCell align="center">Objects</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell component="th" scope="row">
                    {row.org_name}
                  </TableCell>
                  <TableCell align="center">{row.login_url}</TableCell>
                  <TableCell align="center">{row.username}</TableCell>
                  <TableCell align="center">
                    {row.Objects.map(object => (
                      <span key={object.object_api_name}>
                        {" "}
                        {object.object_api_name}{" "}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    <div>
                      <NewConnection
                        buttonClassName="table-button"
                        buttonText="Set Objects"
                        loginUrl={row.login_url}
                        username={row.username}
                        orgId={row.id}
                        selectedObjects={row.Objects}
                        openIn="ConnectionTable"
                        refreshData={this.getConnectionData}
                        handleSnack={this.props.handleSnack}
                        handleLoading={this.props.handleLoading}
                      />
                      <ConfirmDialog
                        buttonClassName="table-button"
                        buttonText="Delete"
                        buttonColor="secondary"
                        open={false}
                        dialogContent="Are you sure you want to delete this connection?"
                        confirm={() => this.handleConnectionDelete(row.id)}></ConfirmDialog>
                    </div>
                    {row.Objects.length > 0 && (
                      <div>
                        <Link to={`/data-table/${row.id}`}>
                          <Button color="primary" variant="contained" className="table-button">
                            View Data
                        </Button>
                        </Link>
                        <Button
                          onClick={() => this.handleExport(row.id, row.org_name)}
                          color="default"
                          variant="contained"
                          className="table-button"
                        >
                          Export
                      </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div >
    );
  }
}

export default ConnectionTable;
