'use strict';

const WPAPI = require('wpapi');
const pug = require('pug');
const fs = require('fs');
var toMarkdown = require('to-markdown');

const { WP_END_POINT, WP_USERNAME, WP_PASSWORD } = process.env;
const compiledFunction = pug.compileFile('./templates/index.pug', { pretty: true });

const wp = new WPAPI({
    endpoint: WP_END_POINT,
    username: WP_USERNAME,
    password: WP_PASSWORD
});

const IMAGE_REGEXP_STRING = '"[-а-яА-Яa-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\\b"';
const IMAGE_PATH = new RegExp(IMAGE_REGEXP_STRING, 'g');
const IMAGES_REGEXP = /<img([\w\W]+?)\/>/g;

wp.posts().perPage(5).then(function(data) {
    const posts = data.map(singlePost => {
        const originalPost = singlePost.content.rendered;
        const text = originalPost.replace(IMAGES_REGEXP, '');
        const imagesBlock = originalPost.match(IMAGES_REGEXP).join('');
        const images = imagesBlock.match(IMAGE_PATH).map(singlePath => singlePath.replace(/"/g, ''));
        return {
            text: toMarkdown(text),
            images
        }
    })

    fs.writeFile('./dist/index.html', compiledFunction({ posts }), function(err) {
        if (err) {
            console.log(err);
        }
    });
});
