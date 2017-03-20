const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const server = http.createServer(app);
const usersIOP = require('./users.json');
const sectors = require('./sectors.json');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const URL_BACKEND = 'http://localhost:8054/gde-restfull-api-web';



app.get('/ecosystems',(req,res) => {
	res.json(['APN','ANSES','AFIP','NS']);
});

app.get('/users/:ecosystem', (req,res) => {
	let response = usersIOP.filter(elem => elem.cargo === req.params.ecosystem);
	res.json(response);
});

app.get('/reparticiones/:ecosystem',(req,res) => {
	res.json(['REPANSES','REPNS','REPAFIP']);
});

app.get('/sectors/:ecosystem/:reparticion',(req,res) => {
	res.json(sectors.filter(elem => elem.codigoReparticion === req.param.reparticion));
});

app.post("/receive", (req,res) =>{
	let body = req.body;
	let response = {};
	console.log('received -> ', body);
	console.log('==============================================');
	console.log('==============================================');
	console.log('==============================================');
	copyProperties(body,response).then(() => res.end());
	console.log("RESPONSE -> ", response)
//	.then( () => res.json(response));
});


const copyPropertiesWithURL = (body,response) => {
	return Promise.all(Object.keys(body).map( property => {
			if(body[property] !== undefined && body[property] !== null &&
				body[property].constructor === Array){
				return getContentFromList(body[property],response,property);
			}else{
				return getContent(response,property,body);
			}
	}));
}

const copyProperties = (body,response) =>{
	let objWithUrls = undefined;
	Object.keys(body).forEach( property => {
		if(typeof body[property] !== 'object' ||  body[property] === null ||
			body[property] === undefined){
			response[property] = body[property];
		}else{
			objWithUrls = body[property];
			prop = property;
			response[property.toString()] = {};
		}
	});
	return copyPropertiesWithURL(objWithUrls,response[prop]);
}


function getContent(response,property,body){
	return new Promise((resolve,reject) => {
		http.get(body[property], res => {
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



let test = { destino: 'destino',
  ecosistemaOrigen: 'ecosistemaorigen',
  ecosistemaDestino: 'ecosistemadestino',
  estadoSeleccionado: null,
  pasePropietario: false,
  expedienteInteroperable:
   { expediente: 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN',
     trata: 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/trata',
     documentos:
      [ 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/IF-2017-00112909-APN-MARI',
        'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/IF-2017-00099520-APN-MARI',
        'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/PV-2017-00126549-APN-MARI',
        'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/PV-2017-00129486-APN-PRUEBASEE' ],
     historial: 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/historial',
     archivosDeTrabajo:
      [ 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/rest.txt/archivoDeTrabajo',
        'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/ABATE.png/archivoDeTrabajo' ] } }




// It receives a Json of URI's and return a JSON with the result of all invocations //
let res = {};
copyProperties(test,res).then( _ =>{
	console.log("RESULTADO -> ");
	console.log(res);
	console.log(res.expedienteInteroperable.historial);
});