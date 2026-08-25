UPDATE "characters" AS character
SET "image_url" = catalog."image_url"
FROM (
  VALUES
    ('Naruto', 'Naruto Uzumaki', 'https://placehold.co/600x400/png?text=Naruto%20Uzumaki'),
    ('Naruto', 'Sakura Haruno', 'https://placehold.co/600x400/png?text=Sakura%20Haruno'),
    ('One Piece', 'Monkey D. Luffy', 'https://placehold.co/600x400/png?text=Monkey%20D.%20Luffy'),
    ('Bleach', 'Ichigo Kurosaki', 'https://placehold.co/600x400/png?text=Ichigo%20Kurosaki'),
    ('Dragon Ball', 'Goku', 'https://placehold.co/600x400/png?text=Goku'),
    ('Naruto', 'Sasuke Uchiha', 'https://placehold.co/600x400/png?text=Sasuke%20Uchiha'),
    ('One Piece', 'Roronoa Zoro', 'https://placehold.co/600x400/png?text=Roronoa%20Zoro'),
    ('Demon Slayer', 'Tanjiro Kamado', 'https://placehold.co/600x400/png?text=Tanjiro%20Kamado'),
    ('Jujutsu Kaisen', 'Yuji Itadori', 'https://placehold.co/600x400/png?text=Yuji%20Itadori')
) AS catalog("anime", "name", "image_url")
WHERE character."anime" = catalog."anime"
  AND character."name" = catalog."name"
  AND NULLIF(BTRIM(character."image_url"), '') IS NULL;
