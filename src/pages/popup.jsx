import React from 'react';
import ReactDOM from 'react-dom'
import {Switch} from 'antd';
import "antd/dist/antd.less";
import '../css/popup.less';
import headerIconOn from '../assets/images/hi-on.png';
import headerIconOff from '../assets/images/hi-off.png';

const onDragStart = e => {
    e.preventDefault();
}

const Header = (props) => {

    return (
        <div id={props.id}>
            <img src={props.enabled ? headerIconOn : headerIconOff} onDragStart={onDragStart} alt=""/>
            <span>Alora</span>
        </div>
    )

};

const DomainDisplay = (props) => {

    return (
        <div id={props.id}>
            <img src={props.faviconUrl} onDragStart={onDragStart} alt=""/>
            <span>{props.domain}</span>
        </div>
    )

}

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            enabled: false,
            domain: '',
            faviconUrl: '',
            lock: false
        };

        this.onSwitchChange = this.onSwitchChange.bind(this);
    }

    async onSwitchChange(checked) {
        await new Promise(resolve => {
            chrome.runtime.sendMessage({
                reqType: checked ? "popupEnable" : "popupDisable"
            }, resolve);
        });
        this.setState({enabled: checked});
    };

    async componentDidMount() {
        // only invoke after first rendering
        let response = await new Promise(resolve => {
            chrome.runtime.sendMessage({reqType: "popupQuery"}, response1 => {
                resolve(response1);
            });
        });
        console.log(response);
        this.setState({
            enabled: response.enabled,
            domain: response.domain,
            faviconUrl: response.faviconUrl,
            locked: response.locked
        });
    }

    render() {

        return (
            <div>
                <Header id="header" enabled={this.state.enabled}/>
                <div id="prefix">
                    <span>{chrome.i18n.getMessage("popup_block")}</span>
                </div>
                <DomainDisplay id="url" faviconUrl={this.state.faviconUrl} domain={this.state.domain}/>
                <div id="switch">
                    <Switch unCheckedChildren="OFF" checkedChildren="ON" checked={this.state.enabled}
                            onChange={this.onSwitchChange} disabled={this.state.locked}/>
                </div>
                <div id="hint">
                    <div id="hintIcon">
                        <span>i</span>
                    </div>
                    <div id="hintText">
                        <span>{chrome.i18n.getMessage("popup_explanation")}</span>
                    </div>
                </div>
            </div>
        )

    }

}

ReactDOM.render(<App/>, document.getElementById('root'));