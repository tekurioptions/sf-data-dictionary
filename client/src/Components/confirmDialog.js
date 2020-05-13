import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@material-ui/core";

class ConfirmDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: this.props.open
    }
    this.handleOpenChange = this.handleOpenChange.bind(this)
    this.handleConfirm = this.handleConfirm.bind(this)
  };

  handleOpenChange() {
    this.setState({open: this.state.open ? false : true})
  }

  handleConfirm() {
    this.props.confirm();
    this.setState({open: false});
  }

  render() {
    return (
      <div className={this.props.buttonClassName}>
        <Button
          color={this.props.buttonColor}
          variant="contained"
          onClick={this.handleOpenChange}>
            {this.props.buttonText}
        </Button>
        <Dialog
          className="dialog"
          open={this.state.open}
          onClose={this.handleOpenChange}
          aria-labelledby="form-dialog-title"
        >
          <DialogContent className="dialog-content">
            {this.props.dialogContent}
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleOpenChange} color="secondary" >
              No
            </Button>
            <Button
              onClick={this.handleConfirm}
              color="primary"
            >
              Yes
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

export default ConfirmDialog;