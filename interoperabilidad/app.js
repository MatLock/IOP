const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const server = http.createServer(app);

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const URL_BACKEND = 'http://ee-rest-backend.nac.everis.int/gde-restfull-api-web';


app.get('/ecosystems',(req,res) => {
	res.json(['APN','ANSES','AFIP','NS']);
});


app.post("/receive", (req,res) =>{
	let body = req.body;
	let response = {};
	copyProperties(body,response)
	.then( () => res.json(response));
});

const copyProperties = (body,response) => {
	return Promise.all(Object.keys(body).map( property => {
			if(body[property].constructor === Array){
				return getContentFromList(body[property],response,property);
			}else{
				return getContent(body[property],response,property);
			}
		}));
	}

function getContent(url,response,property){
	return new Promise((resolve,reject) => {
		http.get(url, res => {
				let json = '';
				res.on('data', data => json += data );
			 	res.on('end', _ => { 
			 		response[property.toString()] = toJson(json);
			 		resolve(response);
				});
			});
	});
}

function getContentFromList(arrayOfProperties,response,property){
	response[property.toString()] = [];
	return Promise.all( arrayOfProperties.map((elem,index) => {
				return new Promise ((resolve,reject) => {
					http.get(elem, res =>{
					let json = '';
					res.on('data', data => { json += data });
			 		res.on('end', _ => {
			 			response[property.toString()].push(toJson(json));
			 			resolve(response);
			 		});
				});
			});
	}));
}



function toJson(str){
	try{
		return JSON.parse(str);
	}catch(e){}

	return str;
}

server.listen(5000);






let test = {
		expediente:'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN',
		historial:'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/historial',
		codigoTrata:'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/trata',
		documentos:
	['http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/IF-2017-00099520-APN-MARI',
	'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/IF-2017-00112909-APN-MARI'],
	archivoDeTrabajo: ['http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/00112908/APN/rest.txt/archivoDeTrabajo',
					  'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/00112908/APN/ABATE.png/archivoDeTrabajo']
	};
console.log("ENTRADA ->", test);


/* It receives a Json of URI's and return a JSON with the result of all invocations */

copyProperties(test,{}).then( arr =>{
	console.log("RESULTADO -> ");
	console.log(arr[0])
});