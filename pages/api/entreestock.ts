// pages/api/stock_entries.ts

import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const entryId = req.query.id as string;

    if (entryId) {
      try {
        // Récupérer une entrée en stock par ID, avec les informations du produit associé
        const { rows: entry } = await sql`
          SELECT es.*, p.name AS produit_name 
          FROM entreesstock es 
          JOIN produits p ON es.produit_id = p.id 
          WHERE es.id = ${entryId}
        `;
        if (entry.length > 0) {
          res.status(200).json(entry[0]);
        } else {
          res.status(404).json({ error: "Entrée en stock non trouvée" });
        }
      } catch (error) {
        res
          .status(500)
          .json({
            error: "Erreur lors de la récupération de l'entrée en stock",
          });
      }
    } else {
      try {
        // Récupérer toutes les entrées en stock, avec les informations des produits associés
        const { rows: entries } = await sql`
          SELECT es.*, p.name AS produit_name 
          FROM entreesstock es 
          JOIN produits p ON es.produit_id = p.id
        `;
        res.status(200).json(entries);
      } catch (error) {
        res
          .status(500)
          .json({
            error: "Erreur lors de la récupération des entrées en stock",
          });
      }
    }
  } else if (req.method === "POST") {
    try {
      const { produit_id, date, quantite } = req.body;

      // Vérifier si le produit existe
      const { rows: productRows } = await sql`
        SELECT * FROM produits WHERE id = ${produit_id}
      `;
      if (productRows.length === 0) {
        res.status(404).json({ error: "Produit non trouvé" });
        return;
      }

      const product = productRows[0];

      // Créer une nouvelle entrée en stock
      const { rows: newEntry } = await sql`
        INSERT INTO entreesstock (produit_id, date, quantite) 
        VALUES (${produit_id}, ${date}, ${quantite}) 
        RETURNING *
      `;

      // Mettre à jour le stock du produit
      await sql`
        UPDATE produits 
        SET quantite_stock = ${product.quantite_stock + quantite} 
        WHERE id = ${produit_id}
      `;

      res.status(201).json(newEntry[0]);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la création de l'entrée en stock" });
    }
  } else if (req.method === "DELETE") {
    const entryId = req.query.id as string;
    if (!entryId) {
      res
        .status(400)
        .json({
          error: "L'ID de l'entrée en stock est requis pour la suppression",
        });
      return;
    }

    try {
      // Trouver l'entrée en stock à supprimer
      const { rows: entryRows } = await sql`
        SELECT * FROM entreesstock WHERE id = ${entryId}
      `;
      if (entryRows.length === 0) {
        res.status(404).json({ error: "Entrée en stock non trouvée" });
        return;
      }

      const entry = entryRows[0];

      // Récupérer le produit associé à l'entrée en stock
      const { rows: productRows } = await sql`
        SELECT * FROM produits WHERE id = ${entry.produit_id}
      `;
      if (productRows.length === 0) {
        res.status(404).json({ error: "Produit non trouvé" });
        return;
      }

      const product = productRows[0];

      // Mettre à jour le stock du produit (soustraire la quantité de l'entrée supprimée)
      await sql`
        UPDATE produits 
        SET quantite_stock = ${product.quantite_stock - entry.quantite} 
        WHERE id = ${product.id}
      `;

      // Supprimer l'entrée en stock
      await sql`
        DELETE FROM entreesstock WHERE id = ${entryId}
      `;

      res
        .status(200)
        .json({ message: "Entrée en stock supprimée avec succès" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression de l'entrée en stock" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
