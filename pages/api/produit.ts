// pages/api/products.ts

import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Récupérer tous les produits ou un produit par ID si l'ID est fourni
    const productId = req.query.id as string;
    if (productId) {
      try {
        const { rows: product } =
          await sql` SELECT * FROM produits WHERE id = ${productId};
          SELECT * FROM entreestock WHERE produit_id = ${productId};
          SELECT * FROM inventairedetails WHERE produit_id = ${productId};`;
        if (product.length > 0) {
          res.status(200).json(product);
        } else {
          res.status(404).json({ error: "Produit non trouvé" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération du produit" });
      }
    } else {
      try {
        const { rows: products } = await sql`
          SELECT * FROM produits;
        `;

        if (products.length < 1) {
          res
            .status(500)
            .json({ error: "Erreur lors de la récupération des fournisseurs" });
        } else {
          res.status(200).json(products);
        }
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération des produits" });
      }
    }
  } else if (req.method === "POST") {
    try {
      const {
        nom,
        description,
        prix_unitaire,
        quantite_stock,
        seuil_quantite,
      } = req.body;
      const { rows: newProduct } = await sql`
        INSERT INTO produits (nom, description, prix_unitaire, quantite_stock, seuil_quantite) 
        VALUES (${nom}, ${description}, ${prix_unitaire}, ${quantite_stock}, ${seuil_quantite}) 
        RETURNING *;
      `;
      res.status(201).json(newProduct[0]);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la création du produit" });
    }
  } else if (req.method === "PATCH" || req.method === "PUT") {
    const productId = req.query.id as string;
    if (!productId) {
      res
        .status(400)
        .json({ error: "L'ID du produit est requis pour la mise à jour" });
      return;
    }

    try {
      const {
        nom,
        description,
        prix_unitaire,
        quantite_stock,
        seuil_quantite,
      } = req.body;
      const { rowCount } = await sql`
        UPDATE produits 
        SET nom = ${nom}, description = ${description}, prix_unitaire = ${prix_unitaire}, 
            quantite_stock = ${quantite_stock}, seuil_quantite = ${seuil_quantite} 
        WHERE id = ${productId};
      `;
      if (rowCount === 0) {
        res.status(404).json({ error: "Produit non trouvé" });
      } else {
        const { rows: updatedProduct } = await sql`
          SELECT * FROM produits WHERE id = ${productId};
        `;
        res.status(200).json(updatedProduct[0]);
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du produit" });
    }
  } else if (req.method === "DELETE") {
    const productId = req.query.id as string;
    if (!productId) {
      res
        .status(400)
        .json({ error: "L'ID du produit est requis pour la suppression" });
      return;
    }

    try {
      const { rowCount } = await sql`
        DELETE FROM produits WHERE id = ${productId};
      `;
      if (rowCount === 0) {
        res.status(404).json({ error: "Produit non trouvé" });
      } else {
        res.status(200).json({ message: "Produit supprimé avec succès" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression du produit" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH", "PUT", "DELETE"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
