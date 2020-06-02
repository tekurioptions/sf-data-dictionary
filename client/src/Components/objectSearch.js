import React from "react";
import "./objectSearch.css";
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
} from "@material-ui/core";

class ObjectSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedObjects: this.props.selectedObjects,
      searchObjects: this.props.availableObjects,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
  }

  componentDidMount() {
    // If updating connection there are already selected objects, format these to original object values to remain selected in list
    if (this.state.selectedObjects.length > 0) {
      let x = this.state.selectedObjects.map((y) => {
        return this.props.availableObjects.find(
          (z) => z.name === y.object_api_name
        );
      });
      this.setState({ selectedObjects: x });
    }
  }

  handleChange(event) {
    // Filtering results that are shown in list
    let searchCriteria = event.target.value;
    if (event.target.value.length > 0) {
      this.setState({
        searchObjects: this.props.availableObjects.filter((x) =>
          x.name.toLowerCase().includes(searchCriteria.toLowerCase())
        ),
      });
    } else {
      this.setState({ searchObjects: this.props.availableObjects });
    }
  }

  handleSelection(event) {
    // Using object name to find and filter as this is the unique value on the object
    let object = this.state.searchObjects.find(
      (x) => x.name === event.target.value
    );
    if (this.state.selectedObjects.indexOf(object) > -1) {
      // Object is already selected, filtering out
      this.setState(
        (state) => {
          const selectedObjects = state.selectedObjects.filter(
            (x) => x.name !== object.name
          );
          return { selectedObjects };
        },
        () => {
          this.props.handleSelection(this.state.selectedObjects);
        }
      );
    } else {
      // Object is not selected, adding to array
      this.setState(
        (state) => {
          const selectedObjects = state.selectedObjects.concat(object);
          return { selectedObjects };
        },
        () => {
          this.props.handleSelection(this.state.selectedObjects);
        }
      );
    }
  }

  render() {
    return (
      <div>
        <TextField
          autoFocus
          margin="dense"
          id="searchCriteria"
          type="text"
          placeholder="Search for available objects here"
          fullWidth
          onChange={this.handleChange}
        />
        <div className="object-selection-list">
          <List>
            {this.state.searchObjects.map((x, i) => {
              const labelId = `checkbox-list-label-${i}`;
              return (
                <ListItem key={x.name} dense button>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={this.state.selectedObjects.indexOf(x) !== -1}
                      tabIndex={-1}
                      disableRipple
                      value={x.name}
                      inputProps={{ "aria-labelledby": labelId }}
                      onClick={this.handleSelection}
                    />
                    <ListItemText id={labelId} primary={x.name} />
                  </ListItemIcon>
                </ListItem>
              );
            })}
          </List>
        </div>
      </div>
    );
  }
}

export default ObjectSearch;
