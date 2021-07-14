const BASE_URL =
  "https://strangers-things.herokuapp.com/api/2101-vpi-rm-web-pt";
const POSTS_URL =
  "https://strangers-things.herokuapp.com/api/2101-vpi-rm-web-pt/posts";
const LOGIN_URL =
  "https://strangers-things.herokuapp.com/api/2101-vpi-rm-web-pt/users/login";
const REGISTER_URL =
  "https://strangers-things.herokuapp.com/api/2101-vpi-rm-web-pt/users/register";

let token = localStorage.getItem("token");

const state = { posts: [], matches: [], page: true };

window.auth_state = {
  currentUserObj: null,
  currentUser: localStorage.getItem("currentUser"),
  currentForm: "login",
  authError: null,
};

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

function renderPost(post) {
  const displayName = post.author.username;
  if (location === "[On Request]" || location === "")
    location = "Available on request.";
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
    }</span>
</div>
`).data("post", post);
}

function renderPostList(posts) {
  const postListHere = $("#posts_container");
  postListHere.empty();
  posts.forEach(function (post) {
    postListHere.append(renderPost(post));
  });
}

const authForm = $("#auth_form");

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

    token = null;
    window.auth_state.currentUser = null;

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
      console.log(result);
      if (result.error) {
        window.auth_state.authError = result.error.message;
        return;
      }
      const _token = result.data.token;
      localStorage.setItem("token", _token);
      localStorage.setItem("currentUser", username);
      window.auth_state.currentUser = username;
      token = _token;

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
      console.log(result);
      if (result.error) {
        window.auth_state.authError = result.error.message;
        return;
      }
      const _token = result.data.token;
      localStorage.setItem("token", _token);
      localStorage.setItem("currentUser", username);
      window.auth_state.currentUser = username;
      token = _token;

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

function screenRefresh(posts) {
  $("#posts_container").empty();
  posts.forEach((post) => {
    $("#posts_container").prepend(renderPost(post));
  });
}

$(".search").click(async (event) => {
  event.preventDefault();

  const searchValue = $(".searchForm").val();
  const searchForm = $(".searchForm");

  if (!searchValue) {
    screenRefresh(state.posts);
    return;
  }
  const searchTerms = searchValue.toLowerCase().split(" ");

  const matches = state.posts.filter((postObj) => {
    const titleWords = postObj.title.toLowerCase();
    const bodyWords = postObj.description.toLowerCase();
    const priceWords = postObj.price.toLowerCase();

    const titleMatch = searchTerms.some((searchTerm) => {
      return titleWords.includes(searchTerm);
    });
    const bodyMatch = searchTerms.some((searchTerm) => {
      return bodyWords.includes(searchTerm);
    });
    const priceMatch = searchTerms.some((searchTerm) => {
      return priceWords.includes(searchTerm);
    });

    const isMatch = titleMatch + bodyMatch + priceMatch;
    return isMatch;
  });
  screenRefresh(matches);
  searchForm.trigger("reset");
});

async function createPost(post) {
  try {
    const response = await fetch(POSTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(post),
    });
    const newPost = await response.json();
    console.log(newPost);
    return newPost;
  } catch (error) {
    throw error;
  }
}

$("#post-form").on("submit", async (event) => {
  event.preventDefault();
  let delivery;
  if ($("#delivery").val() === "Yes") {
    delivery = true;
  } else {
    delivery = false;
  }
  const newPosting = {
    post: {
      title: $("#create-title").val(),
      description: $("#create-description").val(),
      price: $("#create-price").val(),
      location: $("#create-location").val(),
      willDeliver: delivery,
    },
  };
  await createPost(newPosting);
  bootstrap();
});

async function deletePost(postId) {
  try {
    const url = `${POSTS_URL}/${postId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    throw error;
  }
}

async function bootstrap() {
  const hopefulPosts = await fetchPosts();
  console.log(hopefulPosts);
  console.log(hopefulPosts.data);
  renderPostList(hopefulPosts.data.posts);
}

bootstrap();
