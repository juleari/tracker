var jade = require("jade");

function p_401(response, mess) {
  console.log(mess);
  response.writeHead(401, {"Content-Type": "text/plain"});
  mess = mess ? mess.toString() : 'unauth'
  response.write(mess);
  response.end();
}

function p_403(response, mess) {
  console.log(mess);
  response.writeHead(403, {"Content-Type": "text/plain"});
  mess = mess ? mess.toString() : 'access error'
  response.write(mess);
  response.end();
}

function p_404(response, url) {
  var html = jade.renderFile(__dirname + '/templates/error.jade', {
      title: '404 Страница не найдена',
      mess: ['Станица с адресом:', ' http://localhost:3000' + url, ' не существует. Проверьте введённый адрес']
    });

  response.writeHead(404, {"Content-Type": "text/html"});
  response.write(html);
  response.end();
}

function p_500(response, err) {
  err = err ? err.toString() : 'server error';
  var html = jade.renderFile(__dirname + '/templates/error.jade', {
      title: '500 Ошибка сервера',
      mess: 'Сообщение об ошибке: ' + err.toString()
    });

  response.writeHead(404, {"Content-Type": "text/html"});
  response.write(html);
  response.end();
}

exports.p_401 = p_401;
exports.p_403 = p_403;
exports.p_404 = p_404;
exports.p_500 = p_500;

