import React from "react";
import { TextField } from "@material-ui/core";

class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.props.handleChange(event.target.id, event.target.value);
  }

  render() {
      return(
        <div>
            <TextField
              autoFocus
              margin="dense"
              id="login_url"
              label="Login URL (Use HTTPS)"
              type="url"
              fullWidth
              value={this.props.loginUrl ? this.props.loginUrl : null}
              onChange={this.handleChange}
            />
            <TextField
              autoFocus
              margin="dense"
              id="username"
              label="User Name"
              type="email"
              fullWidth
              value={this.props.username ? this.props.username : null}
              onChange={this.handleChange}
            />
            <TextField
              autoFocus
              margin="dense"
              id="password"
              label="Password"
              type="text"
              fullWidth
              onChange={this.handleChange}
            />
            <TextField
              autoFocus
              margin="dense"
              id="security_token"
              label="Security Token"
              type="text"
              fullWidth
              onChange={this.handleChange}
            />
        </div>
      )
  }
}

export default LoginForm;
