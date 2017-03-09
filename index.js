'use strict';

const toMarkdown = require('to-markdown');
const WPAPI = require('wpapi');
const pug = require('pug');
const fs = require('fs');

const { WP_END_POINT } = process.env;
const IMAGE_REGEXP_STRING = '"[-а-яА-Яa-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\\b"';
const IMAGE_PATH = new RegExp(IMAGE_REGEXP_STRING, 'g');
const IMAGES_REGEXP = /<img([\w\W]+?)\/>/g;
const compiledFunction = pug.compileFile('./templates/index.pug', { pretty: true });

const wp = new WPAPI({
    endpoint: WP_END_POINT
});

function chunk(chunkSize, array) {
    var temporal = [];
    for (var i = 0; i < array.length; i += chunkSize) {
        temporal.push(array.slice(i, i + chunkSize));
    }
    return temporal;
}

wp.posts().perPage(8).then(function(data) {
    const posts = data.map((singlePost, index) => {
        const originalPost = singlePost.content.rendered;
        const text = originalPost.replace(IMAGES_REGEXP, '');
        const imagesBlock = originalPost.match(IMAGES_REGEXP).join('');
        const images = imagesBlock.match(IMAGE_PATH).map(singlePath => singlePath.replace(/"/g, ''));
        return {
            text: toMarkdown(text),
            images: chunk(4, images) || []
        };
    });

    fs.writeFile('./dist/index.html', compiledFunction({ posts }), function(err) {
        if (err) {
            console.log(err);
        }
    });
});
