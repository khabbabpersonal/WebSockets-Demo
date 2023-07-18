import React, { useEffect, useState } from 'react';
import { Navbar, NavbarBrand } from 'react-bootstrap';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { DefaultEditor } from 'react-simple-wysiwyg';
import Avatar from 'react-avatar';

import './App.css';

const WS_URL = 'ws://127.0.0.1:8000';

function isUserEvent(message) {
  const parsedMessage = JSON.parse(message.data);
  return parsedMessage.type === 'userevent';
}

function isDocumentEvent(message) {
  const parsedMessage = JSON.parse(message.data);
  return parsedMessage.type === 'contentchange';
}

function App() {
  const [username, setUsername] = useState('');
  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => {
      console.log('WebSocket connection established.');
    },
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true
  });

  useEffect(() => {
    if (username && readyState === ReadyState.OPEN) {
      sendJsonMessage({
        username,
        type: 'userevent'
      });
    }
  }, [username, sendJsonMessage, readyState]);

  return (
    <>
      <Navbar className="navbar" color="light" light>
        <NavbarBrand href="/">Real-time Collaborative Text Editor</NavbarBrand>
      </Navbar>
      <div className="container-fluid">
        {username ? <EditorSection /> : <LoginSection onLogin={setUsername} />}
      </div>
    </>
  );
}

function LoginSection({ onLogin }) {
  const [username, setUsername] = useState('');
  useWebSocket(WS_URL, {
    share: true,
    filter: () => false
  });

  function logInUser() {
    if (!username.trim()) {
      return;
    }
    onLogin && onLogin(username);
  }

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-card">
          <h1 className="login-logo">Welcome, Collaborator!</h1>
          <input
            name="username"
            onInput={(e) => setUsername(e.target.value)}
            className="form-control"
            placeholder="Enter your name" autoComplete='off'
          />
          <button
            type="button"
            onClick={() => logInUser()}
            className="login-btn"
          >
            Join Document
          </button>
        </div>
      </div>
    </div>
  );
}

function History() {
  console.log('history');
  const { lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isUserEvent
  });
  const activities = lastJsonMessage?.data.userActivity || [];

  return (
    <ul className="history-list">
      {activities.map((activity, index) => (
        <li key={`activity-${index}`}>{activity}</li>
      ))}
    </ul>
  );
}


function Users() {
  const { lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isUserEvent
  });
  const users = Object.values(lastJsonMessage?.data.users || []);

  return users.map((user) => (
    <span id={user.username} className="user-info" key={user.username} data-tip={user.username}>
      <Avatar
        name={user.username}
        size={40}
        round="20px"
        className="user-info__avatar"
      />
      <ReactTooltip id={user.username} place="top" type="dark" effect="float">
        {user.username}
      </ReactTooltip>
    </span>
  ));
}

function EditorSection() {
  return (
    <div className="main-content">
      <div className="document-holder">
        <div className="current-users">
          <Users />
        </div>
        <Document />
      </div>
      <div className="history-holder">
        <History />
      </div>
    </div>
  );
}

function Document() {
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isDocumentEvent
  });
  let html = lastJsonMessage?.data.editorContent || '';

  function handleHtmlChange(e) {
    sendJsonMessage({
      type: 'contentchange',
      content: e.target.value
    });
  }

  return <DefaultEditor value={html} onChange={handleHtmlChange} />;
}

export default App;



