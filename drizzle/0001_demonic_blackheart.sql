ALTER TABLE "facilities" ALTER COLUMN "contract_term" SET DATA TYPE daterange USING CASE 
  WHEN contract_term IS NULL THEN NULL 
  ELSE NULL 
END;