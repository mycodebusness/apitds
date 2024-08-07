// pages/api/clients.ts

import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const clientId = req.query.id as string;
    console.log({ clientId });

    if (clientId) {
      try {
        const { rows: client } =
          await sql`SELECT * FROM clients WHERE id = ${clientId}`;
        if (client.length > 0) {
          res.status(200).json(client[0]);
        } else {
          res.status(404).json({ error: "Client non trouvé" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération du client" });
      }
    } else {
      try {
        const { rows: clients } = await sql`SELECT * FROM clients`;
        res.status(200).json(clients);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération des clients" });
      }
    }
  } else if (req.method === "POST") {
    try {
      const { nom, prenom, adresse, telephone } = req.body;
      const { rows: newClient } = await sql`
        INSERT INTO clients (nom, prenom, adresse, telephone) 
        VALUES (${nom}, ${prenom}, ${adresse}, ${telephone})
        RETURNING *;
      `;

      res.status(201).json(newClient[0]);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la création du client" });
    }
  } else if (req.method === "PATCH" || req.method === "PUT") {
    const clientId = req.query.id as string;
    if (!clientId) {
      res.status(400).json({
        error: "L'ID du client est requis pour la mise à jour",
      });
      return;
    }

    try {
      const { nom, prenom, adresse, telephone } = req.body;
      const { rows: client } =
        await sql`SELECT * FROM clients WHERE id = ${clientId}`;
      if (client.length === 0) {
        res.status(404).json({ error: "Client non trouvé" });
        return;
      }

      const { rows: updatedClient } = await sql`
        UPDATE clients 
        SET nom = ${nom}, prenom = ${prenom}, adresse = ${adresse}, telephone = ${telephone} 
        WHERE id = ${clientId}
        RETURNING *;
      `;

      res.status(200).json(updatedClient[0]);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du client" });
    }
  } else if (req.method === "DELETE") {
    const clientId = req.query.id as string;
    if (!clientId) {
      res.status(400).json({
        error: "L'ID du client est requis pour la suppression",
      });
      return;
    }

    try {
      const { rowCount } =
        await sql`DELETE FROM clients WHERE id = ${clientId}`;
      if ((rowCount || 0) > 0) {
        res.status(200).json({ message: "Client supprimé avec succès" });
      } else {
        res.status(404).json({ error: "Client non trouvé" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression du client" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH", "PUT", "DELETE"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
