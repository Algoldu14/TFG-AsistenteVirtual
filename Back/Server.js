const express = require("express");
const app = express();
const path = require("path"); // Path module
const mysql = require("mysql2"); // Mysql module

const hostname = "localhost"; // Localhost
const port = 8080; // Port number

const config = {
  host: "localhost",
  port: 3306,
  database: "wheatherstation",
  user: "root",
  password: "*753/951*",
};
const connection = mysql.createConnection(config);
app.use(express.json({ extended: true }));

//Diccionario de las estaciones
const estacionesDic = new Map();
estacionesDic.set("POLITÉCNICA", 1);
estacionesDic.set("RECTORADO", 2);
estacionesDic.set("CIENCIAS", 3);

//Diccionario de las ciudades
const ciudadesDic = new Map();
ciudadesDic.set("ALCALÁ DE HENARES", 1);
ciudadesDic.set("GUADALAJARA", 2);
ciudadesDic.set("MARCHAMALO", 3);

app.post("/tiempo", function (req, res) {
  //Ciudad que el usuario ha introducido en el chatbot
  const ciudadUser = req.body.sessionInfo.parameters.location.city;

  const queryString =
    "SELECT AVG(VALUE) FROM MEASUREMENT INNER JOIN STATION ON MEASUREMENT.STATION_ID = STATION.ID " +
    "INNER JOIN CITY ON STATION.CITY_ID = CITY.ID WHERE CITY.ID = " +
    ciudadAId(ciudadUser) +
    ";";

  connection.connect(function (err) {
    if (err) {
      res
        .status(503)
        .send(createJSONRes("Error al conectar a la base de datos"));
    }
    connection.query(queryString, (err, results) => {
      if (err) {
        res.status(404).send(createJSONRes("Error al realizar la query"));
      }
      if (results[0]["AVG(VALUE)"] == null) {
        res
          .status(200)
          .send(
            createJSONRes(
              "No hay datos en la localización que has introducido."
            )
          );
      } else {
        res
          .status(200)
          .send(
            createJSONRes(
              "La temperatura media en " +
                ciudadUser +
                " es de: " +
                results[0]["AVG(VALUE)"] +
                " grados"
            )
          );
      }
    });
  });
});

app.post("/estaciones", function (req, res) {
  //Ciudad que el usuario ha introducido en el chatbot para buscar las estaciones
  const ciudadUser = req.body.sessionInfo.parameters.location.city;

  const queryString =
    "SELECT NAME FROM STATION WHERE CITY_ID = " + ciudadAId(ciudadUser) + ";";

  connection.connect(function (err) {
    if (err) {
      res
        .status(503)
        .send(createJSONRes("Error al conectar a la base de datos"));
    }
    connection.query(queryString, (err, results) => {
      if (err) {
        res.status(404).send(createJSONRes("Error al realizar la query"));
      } //Si no hay error
      if (results.length == 0 || results[0]["NAME"] == null) {
        res
          .status(200)
          .send(
            createJSONRes(
              "No hay estaciones en la localización que has introducido."
            )
          );
      } else if (results.length == 1) {
        res
          .status(200)
          .send(
            createJSONRes(
              "La estación en " +
                ciudadUser +
                " es: " +
                results[0]["NAME"] +
                "."
            )
          );
      } else {
        const nombres = results.map((resultado) => resultado.NAME);
        const estaciones = nombres.join(", ") + ".";
        res
          .status(200)
          .send(
            createJSONRes(
              "Las estaciones en " + ciudadUser + " son: " + estaciones
            )
          );
      }
    });
  });
});

app.post("/alertas", function (req, res) {
  //Ciudad que el usuario ha introducido en el chatbot para buscar las estaciones
  const ciudadUser = req.body.sessionInfo.parameters.location.city;
  const estacionUser = req.body.sessionInfo.parameters.address;

  //Si no ha introducido una estación mostramos todas las alertas de la ciudad
  if (estacionUser == undefined) {
    const queryString =
      "SELECT SENSORTYPE.NAME AS tipoalerta, ALERT.DESCRIPTION AS descripcion FROM ALERT " +
      "INNER JOIN ALERT_EVENTS ON ALERT.ID = ALERT_EVENTS.ALERT_ID INNER JOIN SENSORTYPE ON ALERT_EVENTS.SENSORTYPE_ID = SENSORTYPE.ID " +
      "INNER JOIN STATION ON ALERT_EVENTS.STATION_ID = STATION.ID WHERE ALERT_EVENTS.ACTIVE = 1 AND STATION.CITY_ID = " +
      ciudadAId(ciudadUser) +
      ";";

    connection.connect(function (err) {
      if (err) {
        res
          .status(503)
          .send(createJSONRes("Error al conectar a la base de datos"));
      }
      connection.query(queryString, (err, results) => {
        if (err) {
          res.status(404).send(createJSONRes("Error al realizar la query"));
        } //Si no hay error
        if (
          results.length == 0 &&
          (results[0]["tipoalerta"] == null ||
            results[0]["descripcion"] == null)
        ) {
          res
            .status(200)
            .send(
              createJSONRes(
                "No hay estaciones en la localización que has introducido."
              )
            );
        } else if (results.length == 1) {
          res
            .status(200)
            .send(
              createJSONRes(
                "La alerta en " +
                  ciudadUser +
                  " es: Alerta de " +
                  results[0]["tipoalerta"] +
                  " con descripcion " +
                  results[0]["descripcion"] +
                  "."
              )
            );
        } else {
          const datosConcatenados = results.map(
            (resultado) =>
              `Alerta de tipo ${resultado.tipoalerta} --> ${resultado.descripcion}\n`
          );
          const datosAlertas = datosConcatenados.join("");
          res
            .status(200)
            .send(
              createJSONRes(
                "Las alertas en " + ciudadUser + " son: \n" + datosAlertas
              )
            );
        }
      });
    });
  } else {
    const queryEC =
      "SELECT SENSORTYPE.NAME AS tipoalerta, ALERT.DESCRIPTION AS descripcion FROM ALERT " +
      "INNER JOIN ALERT_EVENTS ON ALERT.ID = ALERT_EVENTS.ALERT_ID INNER JOIN SENSORTYPE ON ALERT_EVENTS.SENSORTYPE_ID = SENSORTYPE.ID " +
      "INNER JOIN STATION ON ALERT_EVENTS.STATION_ID = STATION.ID WHERE ALERT_EVENTS.ACTIVE = 1 AND ALERT_EVENTS.STATION_ID = " +
      estacionAId(estacionUser) +
      " AND STATION.CITY_ID = " +
      ciudadAId(ciudadUser) +
      ";";
    connection.connect(function (err) {
      if (err) {
        res
          .status(503)
          .send(createJSONRes("Error al conectar a la base de datos"));
      }
      connection.query(queryEC, (err, results) => {
        if (err) {
          res.status(404).send(createJSONRes("Error al realizar la query"));
        } //Si no hay error
        if (results.length == 0) {
          res
            .status(200)
            .send(
              createJSONRes(
                "No hay estaciones en la localización que has introducido."
              )
            );
        } else if (results.length == 1) {
          res
            .status(200)
            .send(
              createJSONRes(
                "La alerta en " +
                  ciudadUser +
                  " y en concreto en" +
                  estacionUser +
                  "  es: Alerta de " +
                  results[0]["tipoalerta"] +
                  " con descripcion " +
                  results[0]["descripcion"] +
                  "."
              )
            );
        } else {
          const datosConcatenados = results.map(
            (resultado) =>
              `Alerta de tipo ${resultado.tipoalerta} --> ${resultado.descripcion}\n`
          );
          const datosAlertas = datosConcatenados.join("");
          res
            .status(200)
            .send(
              createJSONRes(
                "Las alertas " +
                  ciudadUser +
                  " y en concreto en" +
                  estacionUser +
                  " son: \n" +
                  datosAlertas
              )
            );
        }
      });
    });
  }
});

function createJSONRes(texto_respuesta) {
  const jsonResponse = {
    fulfillment_response: {
      messages: [
        {
          text: {
            //fulfillment text response to be sent to the agent
            text: [texto_respuesta],
          },
        },
      ],
    },
  };
  return jsonResponse;
}

function ciudadAId(ciudad_user) {
  for (const [ciudad, id] of ciudadesDic.entries()) {
    if (ciudad_user.toUpperCase() == ciudad) {
      return id;
    } 
  }
  return 0;
}

function estacionAId(estacion_user) {
  for (const [estacion, id] in estacionesDic) {
    if (estacion_user.toUpperCase() == estacion) {
      return id;
    } 
  }
  return 0;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "/Front/web.html"));
});

app.get("/web.css", (req, res) => {
  res.set("Content-Type", "text/css");
  res.sendFile(path.join(__dirname, "..", "/Front/web.css"));
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
