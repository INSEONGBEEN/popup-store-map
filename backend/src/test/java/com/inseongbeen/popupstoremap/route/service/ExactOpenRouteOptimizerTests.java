package com.inseongbeen.popupstoremap.route.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ExactOpenRouteOptimizerTests {

    @Test
    void findsExactOpenRouteWithFixedOriginAndAsymmetricCosts() {
        double[] origin = { 8, 2, 9 };
        double[][] destinations = {
                { 0, 8, 1 },
                { 2, 0, 7 },
                { 9, 1, 0 }
        };

        assertThat(ExactOpenRouteOptimizer.optimize(origin, destinations)).containsExactly(1, 0, 2);
    }

    @Test
    void usesStableLexicographicTieBreak() {
        assertThat(ExactOpenRouteOptimizer.optimize(
                new double[] { 1, 1 },
                new double[][] { { 0, 1 }, { 1, 0 } }
        )).containsExactly(0, 1);
    }

    @Test
    void rejectsAnUnreachableCost() {
        assertThatThrownBy(() -> ExactOpenRouteOptimizer.optimize(
                new double[] { Double.POSITIVE_INFINITY, 1 },
                new double[][] { { 0, 1 }, { 1, 0 } }
        )).hasMessageContaining("도보 경로");
    }
}
