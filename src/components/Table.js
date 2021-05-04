import React from 'react';
import './Table.css';

function Table({ imprint }) {
    return(
        <div className="table">
            <tr>
                <td>Straße:</td>
                <td>{imprint.Straße}</td>
            </tr>
            <tr>
                <td>PLZ:</td>
                <td>{imprint.Plz}</td>
            </tr>
            <tr>
                <td>Stadt:</td>
                <td>{imprint.Stadt}</td>
            </tr>
            <tr>
                <td>Telefon:</td>
                <td>{imprint.Telefon}</td>
            </tr>
            <tr>
                <td>Fax:</td>
                <td>{imprint.Fax}</td>
            </tr>
            <tr>
                <td>Email:</td>
                <td>{imprint.Email}</td>
            </tr>
        </div>
    );
}

export default Table;