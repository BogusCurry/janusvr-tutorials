function JanusWebEditor(articlelisturl) {
  this.viewer = document.getElementById('viewer');
  this.editor_markup = document.getElementById('editor_markup');
  this.editor_script = document.getElementById('editor_script');
  this.editor_tabs = document.getElementById('editor_tabs');
  this.article_select = document.getElementById('article_select');
  this.scriptname = 'test.js';

  this.client = false;
  this.viewer.addEventListener('load', function() {
    this.client = this.viewer.contentWindow.janusweb;
    setTimeout(function() {
      this.updateScene();
    }.bind(this), 1000);
  }.bind(this));

  var timer = false;
  this.editor_markup.addEventListener('input', function() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() {
      this.updateScene();
    }.bind(this), 500);
  }.bind(this));
  this.editor_script.addEventListener('input', function() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() {
      this.updateScene();
    }.bind(this), 500);
  }.bind(this));
  this.showEditorFile('markup');
  this.loadArticleList(articlelisturl);
}
JanusWebEditor.prototype.loadArticleList = function(listurl) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', listurl);
  xhr.addEventListener('load', function() {
    var articles = JSON.parse(xhr.responseText);
    var names = Object.keys(articles);
    var articlename = names[0];
    this.articles = articles;

    if (document.location.hash) {
      articlename = decodeURIComponent(document.location.hash.substr(1).replace(/\+/g, '%20'));
    }
    this.updateArticleList();
    this.setSelectedArticle(articlename);
  }.bind(this));
  xhr.send();
}
JanusWebEditor.prototype.updateArticleList = function() {
  this.article_select.innerHTML = '';
  for (var k in this.articles) {
    var option = document.createElement('option');
    option.value = k;
    option.innerHTML = k;
    this.article_select.appendChild(option);
  }
}
JanusWebEditor.prototype.load = function(path, files) {
  var ids = {
    article: 'article_content',
    markup: 'editor_markup',
    script: 'editor_script',
    contents: 'article_content_list',
  };
  if (path[path.length-1] != '/') path += '/';

  this.articlepath = document.location.href + path;

  var promises = [];
  for (var k in files) {
    if (files[k]) {
      promises.push(new Promise(function(resolve, reject) {
        this.loadFile(path + files[k]).then(function(name, contents) {
          var el = document.getElementById(ids[name]);
          //console.log('loaded!', name, contents);
          if (el instanceof HTMLTextAreaElement) {
            el.value = contents;
          } else {
            el.innerHTML = contents;
          } 
          resolve();
        }.bind(this, k));
      }.bind(this)));
      if (k == 'script') {
        this.scriptname = files[k];
      }
    } else {
      var el = document.getElementById(ids[k]);
      if (el instanceof HTMLTextAreaElement) {
        el.value = '';
      } else {
        el.innerHTML = '';
      } 
    }
  }
  Promise.all(promises).then(function() {
    this.updateScene();
  }.bind(this));
}
JanusWebEditor.prototype.loadFile = function(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.addEventListener('load', function() {
      resolve(xhr.responseText);
    });
    xhr.send();
  });
}
JanusWebEditor.prototype.updateScene = function() {
  if (!this.client) {
    this.client = this.viewer.contentWindow.janusweb;
  }
  if (this.client) {
    var room = this.client.janusweb.currentroom;
    var oldsource = room.fullsource;

    this.viewer.contentWindow.elation.engine.assets.get({assettype: 'script', name: this.scriptname, code: editor_script.value});

    room.validateSource(this.editor_markup.value).then(function(valid) {
      if (valid) {
        this.client.janusweb.loadFromSource(this.editor_markup.value, true, this.articlepath)
      }
    }.bind(this)).catch(function(e) {
      console.error('noooo', e);
    });
  }
}

JanusWebEditor.prototype.showEditorFile = function(type) {
  var tabs = this.editor_tabs.getElementsByTagName('li');
  if (type == 'markup') {
    this.editor_markup.style.display = 'block';
    this.editor_script.style.display = 'none';
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
  } else if (type == 'script') {
    this.editor_markup.style.display = 'none';
    this.editor_script.style.display = 'block';
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
  }
}
JanusWebEditor.prototype.setSelectedArticle = function(name) {
  var article = this.articles[name];
  if (article) {
    this.load(article[0], article[1])
    document.location.hash = encodeURIComponent(name).replace(/%20/g, '+');
    if (this.article_select.value != name) {
      this.article_select.value = name;
    }
  }
}



