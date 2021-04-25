const BASE_URL =
  "https://strangers-things.herokuapp.com/api/2101-vpi-rm-web-pt";
const POSTS_URL =
  "https://strangers-things.herokuapp.com/api/2101-vpi-rm-web-pt/posts";
const LOGIN_URL =
  "https://strangers-things.herokuapp.com/api/2101-vpi-rm-web-pt/posts/users/login";
const REGISTER_URL =
  "https://strangers-things.herokuapp.com/api/2101-vpi-rm-web-pt/posts/users/register";

const token = localStorage.getItem("token");

const state = { posts: [], matches: [], page: true };

function fetchData(url) {
  return fetch(url)
    .then(function (response) {
      return response.json();
    })
    .catch(function (error) {
      console.error(error);
    });
}

function fetchPosts() {
  return fetchData(`${POSTS_URL}`);
}

function renderPosts(post) {
  if (location === "[On Request]" || location === "")
    location = "Available on request.";
  const displayName = username ? username : post.author.username;
  return $(`
<div class="post">
  <h3 class="title">
    ${post.title} </h3>
    <span class="price">
    ${post.price}</span>
    <span class='post-author'>
      <a class="displayName" href="#">${displayName}</a>
    </span>
  <span>${post.description}</span>
  <span class="loc">${post.location}</span>
    <span class="delivery">Delivery Available:${
      post.willDeliver ? "Yes" : "No"
    }</span>}
</div>
`).data("post", post);
}

function renderPostList(post) {
  const postListHere = $("#posts_container");
  postListHere.empty();
  post.forEach(function (post) {
    postListHere.append(renderPosts(post));
  });
}

const authForm = $("#auth_form");

window.auth_state = {
  currentUserObj: null,
  currentUser: localStorage.getItem("currentUser"),
  currentForm: "login",
  authError: null,
};

function renderToggleForm() {
  const { currentForm, authError } = window.auth_state;
  const heading = authHeadlines[currentForm];
  const bylineText = authBylines[currentForm];
  const form = $(`
    <form id="toggle_form">
      <h2>${heading}</h2>
      <div id="error_container">${authError ? authError : ""}</div>
      <input type="text" id="username" placeholder="username"/>
      <input type="password" id="password" placeholder="password"/>
      <button>submit</button>
      <div id="toggle_link"></div>
    </form>
  `);

  const toggleLink = form.find("#toggle_link");
  toggleLink.append(bylineText);

  toggleLink.click(function (event) {
    window.auth_state.currentForm =
      currentForm === "login" ? "register" : "login";
    window.auth_state.authError = null;
    appendAuthForm();
  });

  form.submit(function (event) {
    event.preventDefault();
    const uname = form.find("#username").val();
    const pword = form.find("#password").val();

    authFns[currentForm](uname, pword)
      .then(() => {
        console.log("Logged in!");
        appendAuthForm();
      })
      .catch((error) => {
        console.error(error);
      });
  });

  return form;
}

const authHeadlines = {
  login: "Log in!",
  register: "Register New Account!",
};

const authBylines = {
  login: "Need an account? Register!",
  register: "Already have an account? Login!",
};

const authFns = {
  login: loginUser,
  register: registerUser,
};

function isLoggedIn() {
  if (token === null) return false;

  return token;
}

function renderLogoutButton() {
  const logoutButton = $(`
    <div>
    <h2>welcome ${window.auth_state.currentUser}</h2>
    <button id="logout">Logout</button>
    </div>
  `);

  logoutButton.click(function () {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    appendAuthForm();
  });

  return logoutButton;
}

function loginUser(username, password) {
  return fetch(`${LOGIN_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: {
        username,
        password,
      },
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.error) {
        window.auth_state.authError = result.error.message;
        return;
      }
      const token = result.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", username);
      window.auth_state.currentUser = username;

      return result;
    })
    .catch(console.error);
}

function registerUser(username, password) {
  return fetch(`${REGISTER_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: {
        username,
        password,
      },
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.error) {
        window.auth_state.authError = result.error.message;
        return;
      }
      const token = result.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", username);
      window.auth_state.currentUser = username;

      return result;
    })
    .catch(console.error);
}

async function fetchMe(token) {
  try {
    const response = await fetch(`${BASE_URL}/users/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const parsedJson = await response.json();
    return parsedJson.data;
  } catch (error) {
    console.error(error);
  }
}

function appendAuthForm() {
  authForm.empty();
  authForm.append(renderAuthForm());
}

appendAuthForm();

if (isLoggedIn()) {
  fetchMe(token)
    .then((userObj) => {
      window.auth_state.currentUserObj = userObj;
    })
    .then(() => {
      console.log(window.auth_state);
    })
    .catch(console.error);
}

function isLoggedIn() {
  if (token === null) return false;

  return token;
}

function renderAuthForm() {
  if (isLoggedIn()) {
    return renderLogoutButton();
  }

  return renderToggleForm();
}

function bootstrap() {
  fetchPosts().then(renderPostList);
}

bootstrap();
