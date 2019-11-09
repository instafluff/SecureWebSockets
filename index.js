require( "dotenv" ).config();

const fs = require( "fs" );
const port = process.env.PORT || 3000;

function setupServer() {
	let indexPage = fs.readFileSync( "index.html", "utf8" );
	indexPage = indexPage.replace( "CUSTOMDOMAIN", process.env.DOMAIN || `http://localhost:${port}` );
	if( process.env.CERTIFICATE && process.env.CERTCHAIN && process.env.PRIVATEKEY ) {
		// Create a server with the certificates
		return require( "https" ).createServer( {
			key: fs.readFileSync( process.env.PRIVATEKEY, "utf8" ),
			cert: fs.readFileSync( process.env.CERTIFICATE, "utf8" ),
			ca: fs.readFileSync( process.env.CERTCHAIN, "utf8" )
		}, ( req, res ) => res.end( indexPage ) );
	}
	else {
		return require( "http" ).createServer( ( req, res ) => res.end( indexPage ) );
	}
}

let numClicks = 0;
let server = setupServer();
let io = require( "socket.io" )( server );
io.on( "connection", conn => {
	conn.emit( "count", numClicks ); // Send latest click count on connect
	conn.on( "click", () => {
		numClicks++;
		console.log( `Clicks: ${numClicks}` );
		io.emit( "count", numClicks ); // Broadcast new click count
	} );
} );

server.listen( port, ( err ) => {
	if( err ) {
		return console.error( 'Server could not start:', err );
	}
	console.log( "Server is running" );
} );

// Uncomment the following code to redirect HTTP traffic to HTTPS
// const httpServer = require( "http" ).createServer( ( res, res ) => {
// 	res.writeHead( 301, { Location: `https://${req.headers.host}${req.url}` } );
// 	res.end();
// } );
// httpServer.listen( 80 );
