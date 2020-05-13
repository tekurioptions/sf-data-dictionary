import React from "react";
import { httpPut } from "../Api/http";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper
} from "@material-ui/core";
import "./dataTable.css";

class DataTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data:
        this.props.data && this.props.data.length > 0 ? this.props.data : null,
      newId: null,
      newValue: null
    };
    this.handleChange = this.debounceChange.bind(this);
  }
  timeoutProp = null;

  debounceChange(event) {
    // Debounce text area input time
    if (this.timeoutProp) {
      clearTimeout(this.timeoutProp);
    }
    this.setState({ newId: event.target.id, newValue: event.target.value });
    this.timeoutProp = setTimeout(() => {
      this.handleDebouncedChange(this.state.newId, this.state.newValue);
    }, 500);
  }

  handleDebouncedChange(id, value) {
    // Handle for any custom fields that change. Event is debounced, individual values are sent to server with ID
    // Event.target.id is a string of both custom field id and attribute
    let split = id.split(" ");
    httpPut("/api/CustomFields", {
      id: split[1],
      [split[0]]: value
    }).then(
      result => {
        this.setState({ debouncedId: id, debouncedValue: value });
        this.props.handleSnack("success", "Custom field saved");
      },
      err => {
        this.props.handleSnack("error", "Error saving custom field");
      }
    );
  }

  render() {
    return (
      <div className="table-div">
        <TableContainer component={Paper} className="table-container">
          <Table
            className="table"
            aria-label="simple table"
            stickyHeader
            size="small"
          >
            <TableHead>
              <TableRow  hover>
                <TableCell align="left">Label</TableCell>
                <TableCell align="left">Name</TableCell>
                <TableCell align="left">Type</TableCell>
                <TableCell align="left">Inline Help Text</TableCell>
                <TableCell align="left">Updateable</TableCell>
                <TableCell align="left">Custom</TableCell>
                <TableCell align="left">Picklist Values</TableCell>
                <TableCell align="left">Created Date</TableCell>
                <TableCell align="left">Last Modified Date</TableCell>
                <TableCell align="left">Source Table</TableCell>
                <TableCell align="left">Source Field</TableCell>
                <TableCell align="left">Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.props.data.Fields.map((row, i) => (
                <TableRow hover key={i}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell className="inline-help-cell">
                    {row.inline_help_text}
                  </TableCell>
                  <TableCell>{row.updateable}</TableCell>
                  <TableCell>{row.custom}</TableCell>
                  <TableCell className="picklist-cell">
                    {row.picklist_values}
                  </TableCell>
                  <TableCell>{row.created_date}</TableCell>
                  <TableCell>{row.last_modified_date}</TableCell>
                  <TableCell>
                    <TextField
                      multiline
                      rowsMax="4"
                      variant="outlined"
                      autoFocus
                      margin="dense"
                      id={`source_table ${row.CustomField.id}`}
                      type="text"
                      defaultValue={
                        row.CustomField && row.CustomField.source_table
                          ? row.CustomField.source_table
                          : null
                      }
                      onChange={this.handleChange}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      multiline
                      rowsMax="4"
                      variant="outlined"
                      autoFocus
                      margin="dense"
                      id={`source_field ${row.CustomField.id}`}
                      type="text"
                      defaultValue={
                        row.CustomField && row.CustomField.source_field
                          ? row.CustomField.source_field
                          : null
                      }
                      onChange={this.handleChange}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      multiline
                      rowsMax="4"
                      variant="outlined"
                      autoFocus
                      margin="dense"
                      id={`notes ${row.CustomField.id}`}
                      type="text"
                      defaultValue={
                        row.CustomField && row.CustomField.notes
                          ? row.CustomField.notes
                          : null
                      }
                      onChange={this.handleChange}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
}

export default DataTable;
