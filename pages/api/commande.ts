// pages/api/commandes.ts

import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { date, details } = req.body;

      // Créer une nouvelle commande
      const { rows: newOrder } =
        await sql`INSERT INTO commandes (date) VALUES (${date}) RETURNING *;`;

      const newOrderId = newOrder[0].id;

      // Insérer les détails de commande
      await Promise.all(
        details.map(async (detail: any) => {
          const { produitId, quantite } = detail;
          await sql`INSERT INTO CommandeDetails (commandeid, produitid, quantite) VALUES (${newOrderId}, ${produitId}, ${quantite});`;
        })
      );

      res.status(201).json(newOrder[0]);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Erreur lors de la création de la commande" });
    }
  } else if (req.method === "DELETE") {
    const orderId = req.query.id as string;
    if (!orderId) {
      res
        .status(400)
        .json({ error: "L'ID de la commande est requis pour la suppression" });
      return;
    }

    try {
      // Supprimer les détails de la commande
      await sql`DELETE FROM CommandeDetails WHERE commandeid = ${orderId};`;

      // Supprimer la commande
      await sql`DELETE FROM Commandes WHERE id = ${orderId};`;

      res.status(200).json({
        message: "Commande et détails de commande supprimés avec succès",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression de la commande" });
    }
  } else {
    res.setHeader("Allow", ["POST", "DELETE"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
