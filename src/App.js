import React, { useState, useEffect, useRef } from 'react';
import Table from './components/Table';
import { v4 as uuidv4 } from 'uuid';

import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@material-ui/core';

import CodeOutlinedIcon from '@material-ui/icons/CodeOutlined';

import MuiAlert from '@material-ui/lab/Alert';

import {
  getImprintInformation,
  getImprintUrl,
  parseHtml,
} from './Function';

import {
  isFilled,
} from './Validator';

import './App.css';

const API_URL = "http://localhost:5000/api";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  formControl: {
    minWidth: '100%',
    marginTop: theme.spacing(3),
  },
  button: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      {' Talha Hüseyin Demirel '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function App() {
  const [urlList, setUrlList] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [imprint, setImprint] = useState();
  const [showInput, setShowInput] = useState(false);
  const [openAlert,setOpenAlert] = useState(false);

  const urlInputRef = useRef(null);

  const classes = useStyles();

  useEffect(() => {
    fetch(`${API_URL}/urlList`)
      .then(res => res.json())
      .then(data => {
        setUrlList(data);
      })
  }, [])


  const onURLChange = (e) => {
    const changedUrl = e.target.value;
    setSelectedUrl(changedUrl);
  }

  function toggleCheckBox() {
    if (showInput) {
      setShowInput(false);
      urlInputRef.current.value = null;
    }
    else {
      setShowInput(true);
    }
  }

  const handleOnClick = async () => {

    let url = "";

    if (urlInputRef.current !== null) {
      url = urlInputRef.current.value;
    }
    else {
      url = selectedUrl;
    }

    let sourcecode = "";

    //fetch sourcecode
    await fetch(`${API_URL}/fetchHtml?url=${url}`, { mode: 'cors' })
      .then(res => res.text())
      .then(data => {
        sourcecode = data;
      })

    //get Imprint Url
    let imprintUrl = getImprintUrl(sourcecode, url);

    //fetch imprint page sourcecode
    await fetch(`${API_URL}/fetchHtml?url=${imprintUrl}`, { mode: 'cors' })
      .then(res => res.text())
      .then(data => {
        sourcecode = data;
      })

    //get imprint information
    let imprintInformation = getImprintInformation(sourcecode);

    //problem wenn hälfte der daten geladen sind sucht nochmal
    if (isFilled(imprintInformation) === false) {
      let tempUrl = imprintUrl + "/";

      //fetch imprint page sourcecode
      await fetch(`http://localhost:5000/api/fetchHtml?url=${tempUrl}`, { mode: 'cors' })
        .then(res => res.text())
        .then(data => {
          sourcecode = data;
        })

      //parse imprint page to object
      let parsedHtml = parseHtml(sourcecode);

      imprintInformation = getImprintInformation(parsedHtml, imprintInformation);
      console.log("2:");
      console.log(imprintInformation);
    }

    if (isFilled(imprintInformation) === false) {
      await fetch(`http://localhost:5000/api/fetchHtml?url=${url}`, { mode: 'cors' })
        .then(res => res.text())
        .then(data => {
          sourcecode = data;
        })
      let parsedHtml = parseHtml(sourcecode);
      imprintInformation = getImprintInformation(parsedHtml, imprintInformation);
      console.log("3:");
      console.log(imprintInformation);
    }
    setImprint(imprintInformation);

    if(isFilled(imprintInformation)===false){
      setOpenAlert(true);
    }
  }

  const handleOnCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenAlert(false);
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar variant="rounded" className={classes.avatar}>
          <CodeOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Impress Parser
          </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl variant="filled" className={classes.formControl}>
              <InputLabel htmlFor="filled-inputUrl">Select URL</InputLabel>
              <Select
                value={selectedUrl}
                onChange={onURLChange}
                input={<OutlinedInput
                  name="inputUrl"
                  id="outlined-inputUrl"
                />}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {urlList.map(url => (
                  <MenuItem key={uuidv4()} value={url.url}>{url.url}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Checkbox value={showInput} checked={showInput} onChange={toggleCheckBox} color="primary" />}
              label="Choose if you want to enter an other URL"
            />
          </Grid>
          {showInput ?
            <Grid item xs={12}>
              <TextField
                inputRef={urlInputRef}
                variant="outlined"
                required
                fullWidth
                id="urlField"
                label="Enter URL"
                name="urlField"
                autoComplete="urlField"
              />
            </Grid>
            : null
          }
        </Grid>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={async () => { await handleOnClick(); }}
        >
          Fetch Imprint Data
          </Button>
        {imprint ?
          <Grid item xs={12}>
            <Typography component="h5" variant="h5" align="center">
              Imprint Information:
                </Typography>
            <Table imprint={imprint}></Table>
          </Grid>
          : null
        }
      </div>
      <Box mt={5}>
        <Copyright />
      </Box>
      <Snackbar open={openAlert} autoHideDuration={6000} onClose={handleOnCloseAlert}>
        <Alert onClose={handleOnCloseAlert} severity="error">
          Can't find imprint information on: {selectedUrl}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;

