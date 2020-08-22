import React from 'react';
import ReactDOM from 'react-dom'
import {Switch, Menu, Badge, Popover} from 'antd';
import "antd/dist/antd.less";
import '../css/popup.less';
import headerIcon from '../assets/images/magic.png';

const onDragStart = e => {
    e.preventDefault();
}

const Header = () => {
    return (
        <div className='header'>
            <img src={headerIcon} onDragStart={onDragStart} alt='' className='headerIcon'/>
            <div>
                <h1 className='headerTitle'>Alora</h1>
                <h2 className='headerSubTitle'>Protect your online data privacy</h2>
            </div>
        </div>
    );
};

const MenuBar = () => {
    return (
        <Menu mode='horizontal' activeKey='home'>
            <Menu.Item key='home'>Home</Menu.Item>
            <Menu.Item key='trackers'>
                <Badge count={3}>Trackers</Badge>
            </Menu.Item>
            <Menu.Item key='manage'>Manage</Menu.Item>
        </Menu>
    );
};

const TagLine = (props) => {
    return (
        <div className='tagLine'>
            <Popover placement="bottomLeft" content={<div>{props.hint}</div>} trigger='hover'>
                <div className='tagLineIcon'>
                    <span>i</span>
                </div>
            </Popover>
            <div className='tagLineContent'>
                <span>{props.content}</span>
            </div>
        </div>
    );
};

const DomainDisplay = () => {
    return (
        <div className='domainDisplay'>
            <img className='domainDisplayIcon' src={headerIcon} onDragStart={onDragStart}
                 alt=''/>
            <span className='domainDisplayContent'>www.google.com</span>
        </div>
    );
};

const ToggleSwitch = (props) => {
    return (
        <div className='toggleSwitch' style={{marginTop: `${props.marginTop}px`, marginBottom: `${props.marginBottom}px`}}>
            <Switch/>
        </div>
    )
}

const HomeTab = () => {
    return (
        <>
            <div className='homeTabBox'>
                <TagLine content='Never store my browsing history on'
                         hint='By erasing your browsing history, Alora will help you reduce ads and clean the cache and cookies related to this site on your computer.'/>
                <DomainDisplay/>
                <ToggleSwitch marginTop={5} marginBottom={20}/>
            </div>
            <div className='homeTabBox'>
                <TagLine content='Blocking trackers on all sites'
                         hint='Alora blocks trackers and other malicious scripts from followling you around online to collect information about your browsing habits and interests.'/>
                <ToggleSwitch marginTop={12} marginBottom={15}/>
            </div>
        </>
    );
};

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

    componentDidMount() {
        const asyncFunc = async () => {
            // only invoke after first rendering
            let response = await new Promise(resolve => {
                chrome.runtime.sendMessage({reqType: "popupQuery"}, response1 => {
                    resolve(response1);
                });
            });
            this.setState({
                enabled: response.enabled,
                domain: response.domain,
                faviconUrl: response.faviconUrl,
                locked: response.locked
            });
        };
        asyncFunc.bind(this)();
    }

    render() {
        return (
            <>
                <Header/>
                <MenuBar/>
                <HomeTab/>
            </>
        );
    }

}

ReactDOM.render(<App/>, document.getElementById('root'));