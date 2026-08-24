package com.neetaspirants.api.dto;

import java.time.LocalDate;

public class WellnessDtos {

    public record StressTrendPointDto(LocalDate date, double avgScore, int sampleCount) {}
}
