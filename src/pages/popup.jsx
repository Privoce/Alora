import '../css/popup.css';
import React from 'react';
import ReactDOM from 'react-dom'
import {Switch} from 'antd';

const popupPage = () => {


    return (
        <div>
            <div id="header-container">
                <h1 className="ui header" id="header">
                    <img className="ui image" src="./assets/images/icon-on.png" id="header-image" />
                    <div className="content">
                        Alora
                    </div>
                </h1>
            </div>

            <div id="text-1-container">
                <span id="text-1"></span>
            </div>

            <div id="text-2-container">
                <img src="../assets/images/icon-128.png" id="favicon-img" alt="icon image" />
                <span id="block-site-url">test.url.com</span>
            </div>

            <div id="switch-container">
                <Switch checkedChildren="ON" unCheckedChildren="OFF" defaultChecked />
            </div>

            <div id="text-3-container">
                <div>
                    <i className="info circle icon"></i>
                </div>
                <div>
                    <span id="text-3"></span>
                </div>
            </div>
        </div>
    )
}

ReactDOM.render(<h1>1</h1>, document.getElementById('root'))