// pages/api/users.ts

import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Récupérer tous les utilisateurs ou un utilisateur par ID si l'ID est fourni
    const userId = req.query.id as string;
    if (userId) {
      try {
        const { rows: user } = await sql`
          SELECT * FROM users WHERE iduser = ${userId};
        `;
        if (user.length > 0) {
          res.status(200).json(user[0]);
        } else {
          res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération de l'utilisateur" });
      }
    } else {
      try {
        const { rows: users } = await sql`
          SELECT * FROM users;
        `;
        res.status(200).json(users);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération des utilisateurs" });
      }
    }
  } else if (req.method === "POST") {
    try {
      const { email, mdp, otp } = req.body;
      const { rows: newUser } = await sql`
        INSERT INTO users (email, mdp, otp) 
        VALUES (${email}, ${mdp}, ${otp}) 
        RETURNING *;
      `;
      res.status(201).json(newUser[0]);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la création de l'utilisateur" });
    }
  } else if (req.method === "PATCH" || req.method === "PUT") {
    const userId = req.query.id as string;
    if (!userId) {
      res.status(400).json({
        error: "L'ID de l'utilisateur est requis pour la mise à jour",
      });
      return;
    }

    try {
      const { email, mdp } = req.body;
      const { rowCount } = await sql`
        UPDATE users 
        SET email = ${email}, mdp = ${mdp} 
        WHERE iduser = ${userId};
      `;
      if (rowCount === 0) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
      } else {
        const { rows: updatedUser } = await sql`
          SELECT * FROM users WHERE iduser = ${userId};
        `;
        res.status(200).json(updatedUser[0]);
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  } else if (req.method === "DELETE") {
    const userId = req.query.id as string;
    if (!userId) {
      res.status(400).json({
        error: "L'ID de l'utilisateur est requis pour la suppression",
      });
      return;
    }

    try {
      const { rowCount } = await sql`
        DELETE FROM users WHERE iduser = ${userId};
      `;
      if (rowCount === 0) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
      } else {
        res.status(200).json({ message: "Utilisateur supprimé avec succès" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH", "PUT", "DELETE"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
