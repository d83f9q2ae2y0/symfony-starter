private function validateNoOverlappingDates(array $tarifs, ValidTarifsHistory $constraint): void
    {
        for ($i = 0; $i < count($tarifs) - 1; $i++) {
            $currentTarif = $tarifs[$i];
            $nextTarif = $tarifs[$i + 1];

            // Skip if current tarif has no end_date (should be the last one)
            if (!isset($currentTarif['end_date']) || empty($currentTarif['end_date'])) {
                continue;
            }

            $currentEndDate = new \DateTime($currentTarif['end_date']);
            $nextStartDate = new \DateTime($nextTarif['start_date']);

            // Dates should not overlap (current end_date should be <= next start_date)
            if ($currentEndDate > $nextStartDate) {
                $this->context->buildViolation($constraint->overlappingDatesMessage)
                    ->addViolation();
            }
        }
    }

    private function validateNoGapsInHistory(array $tarifs, ValidTarifsHistory $constraint): void
    {
        for ($i = 0; $i < count($tarifs) - 1; $i++) {
            $currentTarif = $tarifs[$i];
            $nextTarif = $tarifs[$i + 1];

            if (!isset($currentTarif['end_date']) || empty($currentTarif['end_date'])) {
                continue;
            }

            $currentEndDate = new \DateTime($currentTarif['end_date']);
            $nextStartDate = new \DateTime($nextTarif['start_date']);

            // Add one day to current end date to check for gaps
            $expectedNextStart = clone $currentEndDate;
            $expectedNextStart->add(new \DateInterval('P1D'));

            if ($nextStartDate > $expectedNextStart) {
                $this->context->buildViolation($constraint->gapInHistoryMessage)
                    ->addViolation();
            }
        }
    }
