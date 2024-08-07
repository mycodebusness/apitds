// pages/api/totals.ts

import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      // Récupérer les totaux pour chaque table
      const { rows: totalProducts } =
        await sql`SELECT COUNT(*) AS total FROM produits`;
      const { rows: totalUsers } =
        await sql`SELECT COUNT(*) AS total FROM users`;
      const { rows: totalEntreeStock } =
        await sql`SELECT COUNT(*) AS total FROM entreesstock`;
      const { rows: totalStockAlert } =
        await sql`SELECT COUNT(*) AS total FROM stockalerte`;
      const { rows: totalInventaire } =
        await sql`SELECT COUNT(*) AS total FROM inventaires`;
      const { rows: totalCommande } =
        await sql`SELECT COUNT(*) AS total FROM commandes`;
      const { rows: totalClient } =
        await sql`SELECT COUNT(*) AS total FROM clients`;

      // Envoyer les totaux en réponse
      res.status(200).json({
        totalProducts: parseInt(totalProducts[0].total, 10),
        totalUsers: parseInt(totalUsers[0].total, 10),
        totalEntreeStock: parseInt(totalEntreeStock[0].total, 10),
        totalStockAlert: parseInt(totalStockAlert[0].total, 10),
        totalInventaire: parseInt(totalInventaire[0].total, 10),
        totalCommande: parseInt(totalCommande[0].total, 10),
        totalClient: parseInt(totalClient[0].total, 10),
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des totaux", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des totaux" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
