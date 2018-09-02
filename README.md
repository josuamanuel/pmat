# pmat
postman automation testing

git clone https://github.com/josuamanuel/pmat.git



git init
git remote add origin https://github.com/josuamanuel/pmat.git


cat pmat.api.js pmat.engine.js pmat.api.util | grep -vwE "(module.exports|require)" > pmat-globals.js
git add --all .
git commit -m "Automated commit"
git push origin master