import React, { useState, useEffect, useRef } from 'react';
import { FormControl, Select, MenuItem, Card } from '@material-ui/core';
import Table from './components/Table';
import { parse } from 'node-html-parser';
import { v4 as uuidv4 } from 'uuid';

import { parseHtml, getImprintUrl, getImprintInformation, isFilled, parseUrl } from './Function';

import './App.css';

const API_URL = "http://localhost:5000/api";

function App() {
  const [urlList, setUrlList] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState();
  const [html, setHtml] = useState();
  const [imprint, setImprint] = useState();

  useEffect(() => {
    fetch(`${API_URL}/urlList`)
      .then(res => res.json())
      .then(data => {
        console.log(data);
        setSelectedUrl(data[0]);
        setUrlList(data);
      })
  }, [])

  /*    useEffect(() => {
      if(urlList !==[]) {
        var url = urlList[1];
        var u = url;
        console.log(u);
        setSelectedUrl(u);
      }
    },[selectedUrl]) */

  const onURLChange = async (e) => {
    const url = e.target.value;
    let sourcecode = "";

    //const url = "https://www.salesviewer.com/de/";
    //const url ="https://www.nwowhv.de/c/index.php/de/";
    //fetch start page sourcecode
    await fetch(`${API_URL}/fetchHtml?url=${url}`, { mode: 'cors' })
      .then(res => res.text())
      .then(data => {
        sourcecode = data;
      })

    setSelectedUrl(url);

    //parse page to object
    let parsedHtml = parseHtml(sourcecode);

    //locate footer
    let imprintUrl = getImprintUrl(parsedHtml);

    //check if found imprint
    if (imprintUrl === "" || imprintUrl === "#") {
      imprintUrl = url;
    }

    let parsedUrl = parseUrl(imprintUrl, url);

    console.log(parsedUrl);

    //fetch imprint page sourcecode
    await fetch(`${API_URL}/fetchHtml?url=${parsedUrl}`, { mode: 'cors' })
      .then(res => res.text())
      .then(data => {
        sourcecode = data;
      })

    //parse imprint page to object
    parsedHtml = parseHtml(sourcecode);

    //get imprint information
    //setImprint(getImprintInformation(imprintObj));
    let imprintInformation = getImprintInformation(parsedHtml, {
      "Straße": "",
      "Plz": "",
      "Stadt": "",
      "Telefon": "",
      "Fax": "",
      "Email": ""
    });
    console.log(imprintInformation);

    //problem wenn hälfte der daten geladen sind sucht nochmal
    if (isFilled(imprintInformation) === false) {
      let secondUrl = imprintUrl + "/";
      await fetch(`http://localhost:5000/api/fetchHtml?url=${secondUrl}`, { mode: 'cors' })
        .then(res => res.text())
        .then(data => {
          sourcecode = data;
        })

      parsedHtml = parseHtml(sourcecode);

      imprintInformation = getImprintInformation(parsedHtml,imprintInformation);

      console.log("2:");
      console.log(imprintInformation);
    }

    if (isFilled(imprintInformation) === false) {
      await fetch(`http://localhost:5000/api/fetchHtml?url=${url}`, { mode: 'cors' })
        .then(res => res.text())
        .then(data => {
          sourcecode = data;
        })

      parsedHtml = parseHtml(sourcecode);

      imprintInformation = getImprintInformation(parsedHtml,imprintInformation);

      console.log("3:");
      console.log(imprintInformation);
    }



    //console.log(imprintInformation);
  }

  return (
    <>
      <div>
        <FormControl>
          <Select variant="outlined" value={selectedUrl} onChange={onURLChange}>
            {urlList.map(url => (
              <MenuItem key={uuidv4()} value={url.url}>{url.url}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {imprint === undefined ?
          ""
          : <Card>
            {console.log(imprint)}
            <h3>Impressum:</h3>
            <Table imprint={imprint}></Table>
          </Card>}
      </div>
    </>
  );
}

export default App;
