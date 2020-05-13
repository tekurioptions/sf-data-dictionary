import React from "react";
import "./App.css";
import {
  Snackbar,
  Backdrop,
  CircularProgress
} from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";
import ConnectionTable from "./Components/connectionTable";
import { Route } from 'react-router-dom'
import DataTabContainer from "./Components/dataTabContainer";


function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function App() {
  const [snackOpen, setSnackOpen] = React.useState(false);
  const [snackStatus, setSnackStatus] = React.useState("success");
  const [snackMessage, setSnackMessage] = React.useState("");
  const [isLoading, setisLoading] = React.useState(false);

  const handleLoading = () => {
    setisLoading(isLoading ? false : true);
  }

  const handleSnack = (status, message) => {
    setSnackStatus(status);
    setSnackMessage(message);
    setSnackOpen(true);
  };

  const handleSnackClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackOpen(false);
  };

  return (
    <div className="App">
      <Backdrop className="backdrop" open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Route exact path="/" render={(props) => <ConnectionTable {...props} handleSnack={handleSnack} handleLoading={handleLoading} />} />
      <Route exact path="/data-table/:id" render={(props) => <DataTabContainer {...props} handleSnack={handleSnack} handleLoading={handleLoading} />} />
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={handleSnackClose}
      >
        <Alert onClose={handleSnackClose} severity={snackStatus}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
