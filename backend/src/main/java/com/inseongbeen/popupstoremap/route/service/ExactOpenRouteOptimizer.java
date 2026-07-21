package com.inseongbeen.popupstoremap.route.service;

import java.util.ArrayList;
import java.util.List;

import com.inseongbeen.popupstoremap.route.exception.PedestrianRouteException;
import com.inseongbeen.popupstoremap.route.exception.RouteErrorType;

final class ExactOpenRouteOptimizer {

    private static final double EPSILON = 1e-9;

    private ExactOpenRouteOptimizer() {
    }

    static List<Integer> optimize(double[] originCosts, double[][] destinationCosts) {
        int count = originCosts.length;
        int states = 1 << count;
        Path[][] best = new Path[states][count];
        for (int index = 0; index < count; index++) {
            assertFinite(originCosts[index]);
            best[1 << index][index] = new Path(originCosts[index], List.of(index));
        }

        for (int mask = 1; mask < states; mask++) {
            for (int last = 0; last < count; last++) {
                Path current = best[mask][last];
                if (current == null) continue;
                for (int next = 0; next < count; next++) {
                    if ((mask & (1 << next)) != 0) continue;
                    assertFinite(destinationCosts[last][next]);
                    int nextMask = mask | (1 << next);
                    List<Integer> order = new ArrayList<>(current.order());
                    order.add(next);
                    Path candidate = new Path(current.cost() + destinationCosts[last][next], List.copyOf(order));
                    if (isBetter(candidate, best[nextMask][next])) best[nextMask][next] = candidate;
                }
            }
        }

        Path result = null;
        for (Path candidate : best[states - 1]) {
            if (candidate != null && isBetter(candidate, result)) result = candidate;
        }
        if (result == null) throw noRoute();
        return result.order();
    }

    private static boolean isBetter(Path candidate, Path current) {
        if (current == null || candidate.cost() < current.cost() - EPSILON) return true;
        if (Math.abs(candidate.cost() - current.cost()) > EPSILON) return false;
        for (int index = 0; index < candidate.order().size(); index++) {
            int comparison = Integer.compare(candidate.order().get(index), current.order().get(index));
            if (comparison != 0) return comparison < 0;
        }
        return false;
    }

    private static void assertFinite(double cost) {
        if (!Double.isFinite(cost) || cost < 0) throw noRoute();
    }

    private static PedestrianRouteException noRoute() {
        return new PedestrianRouteException(RouteErrorType.NO_ROUTE, "모든 방문지를 연결하는 도보 경로를 찾을 수 없습니다.");
    }

    private record Path(double cost, List<Integer> order) {
    }
}
