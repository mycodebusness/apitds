// Pour gérer le modèle `EntreeStock` et mettre à jour le stock associé au modèle `Produit` lors des opérations CRUD, voici comment vous pouvez structurer votre fichier `stock_entries.ts` dans votre API Next.js :

// ### EntreeStock (Stock Entry)

// ```typescript
// pages/api/stock_entries.ts

import { NextApiRequest, NextApiResponse } from "next";
import { EntreeStock, Produit } from "../model"; // Importez votre modèle Sequelize EntreeStock et Produit

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Récupérer toutes les entrées en stock ou une entrée par ID si l'ID est fourni
    const entryId = req.query.id as string;
    if (entryId) {
      try {
        const entry = await EntreeStock.findByPk(entryId, {
          include: [
            {
              model: Produit,
            },
          ],
        });
        if (entry) {
          res.status(200).json(entry);
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
        const entries = await EntreeStock.findAll({
          include: [
            {
              model: Produit,
            },
          ],
        });
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
      const { ProduitId, date, quantite } = req.body;

      // Vérifier si le produit existe
      const product = await Produit.findByPk(ProduitId);
      if (!product) {
        res.status(404).json({ error: "Produit non trouvé" });
        return;
      }

      // Créer une nouvelle entrée en stock
      const newEntry = await EntreeStock.create({ ProduitId, date, quantite });

      // Mettre à jour le stock du produit
      await product.update({
        quantiteStock: product.quantiteStock + quantite,
      });

      res.status(201).json(newEntry);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la création de l'entrée en stock" });
    }
  } else if (req.method === "DELETE") {
    const entryId = req.query.id as string;
    if (!entryId) {
      res.status(400).json({
        error: "L'ID de l'entrée en stock est requis pour la suppression",
      });
      return;
    }

    try {
      // Trouver l'entrée en stock à supprimer
      const entry = await EntreeStock.findByPk(entryId);
      if (!entry) {
        res.status(404).json({ error: "Entrée en stock non trouvée" });
        return;
      }

      // Récupérer le produit associé à l'entrée en stock
      const product = await Produit.findByPk(entry.ProduitId);
      if (!product) {
        res.status(404).json({ error: "Produit non trouvé" });
        return;
      }

      // Mettre à jour le stock du produit (soustraire la quantité de l'entrée supprimée)
      await product.update({
        quantiteStock: product.quantiteStock - entry.quantite,
      });

      // Supprimer l'entrée en stock
      await entry.destroy();

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
// ```

// ### Explication :

// - **GET**: Permet de récupérer toutes les entrées en stock (`GET /api/stock_entries`) ou une entrée spécifique par son ID (`GET /api/stock_entries?id=1`). Les entrées en stock peuvent inclure des informations sur le produit associé via l'association Sequelize.

// - **POST**: Crée une nouvelle entrée en stock en utilisant les données fournies dans le corps de la requête (`POST /api/stock_entries` avec JSON body contenant `ProduitId`, `date` et `quantite`). Cette opération crée également un nouvel enregistrement dans la table `EntreeStock` et met à jour le stock du produit associé dans la table `Produit`.

// - **DELETE**: Supprime une entrée en stock existante en utilisant l'ID fourni dans la requête (`DELETE /api/stock_entries?id=1`). Cette opération récupère l'entrée en stock à supprimer, récupère le produit associé, met à jour le stock du produit en soustrayant la quantité de l'entrée supprimée, puis supprime l'entrée en stock de la base de données.

// - **Include Sequelize**: Utilisation de `include` pour charger les associations Sequelize pour inclure les informations sur le produit associé à l'entrée en stock.

// - **Validation des données** : Vous devrez peut-être ajouter des vérifications pour les données reçues dans le corps de la requête, comme s'assurer que les champs requis sont présents et ont le bon format.

// - **Gestion des erreurs** : Vous avez déjà mis en place une gestion basique des erreurs avec des codes de statut HTTP appropriés. Assurez-vous de personnaliser les messages d'erreur en fonction du contexte.

// Cette structure devrait vous permettre de gérer efficacement les opérations CRUD pour le modèle `EntreeStock` et de maintenir la cohérence du stock associé au modèle `Produit` dans votre API Next.js. Assurez-vous que votre modèle Sequelize `EntreeStock` et `Produit` sont correctement définis et correspondent aux besoins de votre application.
