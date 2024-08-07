// pages/api/suppliers.ts

import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Récupérer tous les fournisseurs ou un fournisseur par ID si l'ID est fourni
    const supplierId = req.query.id as string;
    if (supplierId) {
      try {
        const { rows: supplier } =
          await sql`SELECT * FROM fournisseurs WHERE id=${supplierId}`;
        if (supplier.length > 0) {
          res.status(200).json(supplier[0]);
        } else {
          res.status(404).json({ error: "Fournisseur non trouvé" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération du fournisseur" });
      }
    } else {
      try {
        const { rows: suppliers } = await sql`SELECT * FROM fournisseurs`;
        if (suppliers.length < 1) {
          res
            .status(500)
            .json({ error: "Erreur lors de la récupération des fournisseurs" });
        } else {
          res.status(200).json(suppliers);
        }
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération des fournisseurs" });
      }
    }
  } else if (req.method === "POST") {
    try {
      const { nom, prenom, adresse, telephone } = req.body;
      const { rows: newSupplier } =
        await sql`INSERT INTO fournisseurs (nom, prenom, adresse, telephone) 
                  VALUES (${nom}, ${prenom}, ${adresse}, ${telephone}) 
                  RETURNING *;`;

      res.status(201).json(newSupplier[0]);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la création du fournisseur" });
    }
  } else if (req.method === "PATCH" || req.method === "PUT") {
    const supplierId = req.query.id as string;
    if (!supplierId) {
      res.status(400).json({
        error: "L'ID du fournisseur est requis pour la mise à jour",
      });
      return;
    }

    try {
      const { nom, prenom, adresse, telephone } = req.body;
      const { rows: supplier } =
        await sql`SELECT * FROM fournisseurs WHERE id=${supplierId}`;
      if (supplier.length === 0) {
        res.status(404).json({ error: "Fournisseur non trouvé" });
        return;
      }

      const { rows: updatedSupplier } = await sql`UPDATE fournisseurs 
                  SET nom = ${nom}, prenom = ${prenom}, adresse = ${adresse}, telephone = ${telephone} 
                  WHERE id = ${supplierId} RETURNING *;`;

      res.status(200).json(updatedSupplier[0]);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du fournisseur" });
    }
  } else if (req.method === "DELETE") {
    const supplierId = req.query.id as string;
    if (!supplierId) {
      res.status(400).json({
        error: "L'ID du fournisseur est requis pour la suppression",
      });
      return;
    }

    try {
      const { rows: supplier } =
        await sql`SELECT * FROM fournisseurs WHERE id=${supplierId}`;
      if (supplier.length === 0) {
        res.status(404).json({ error: "Fournisseur non trouvé" });
        return;
      }

      await sql`DELETE FROM fournisseurs WHERE id=${supplierId}`;
      res.status(200).json({ message: "Fournisseur supprimé avec succès" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression du fournisseur" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH", "PUT", "DELETE"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
